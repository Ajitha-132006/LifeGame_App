from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
#from emergentintegrations.llm.chat import LlmChat, UserMessage
import base64
from PIL import Image
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.getenv('JWT_SECRET', 'life-rpg-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 720

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    username: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Avatar(BaseModel):
    avatar_class: str
    avatar_image: str
    name: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    username: str
    avatar: Optional[Avatar] = None
    level: int = 1
    xp: int = 0
    gold: int = 0
    hp: int = 100
    max_hp: int = 100
    streak: int = 0
    last_quest_date: Optional[str] = None
    badges: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class QuestCreate(BaseModel):
    title: str
    description: str
    quest_type: str
    difficulty: str
    xp_reward: int
    gold_reward: int
    category: str

class Quest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str
    quest_type: str
    difficulty: str
    xp_reward: int
    gold_reward: int
    category: str
    status: str = "active"
    verification_required: bool = False
    verification_type: Optional[str] = None
    verification_data: Optional[dict] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None

class VerificationSubmit(BaseModel):
    quest_id: str
    verification_type: str
    notes: Optional[str] = None

class QuizAnswer(BaseModel):
    quest_id: str
    answers: List[str]

class Achievement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: str
    rarity: str

class LeaderboardEntry(BaseModel):
    username: str
    level: int
    xp: int
    avatar_image: Optional[str] = None

class ShopItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    cost: int
    item_type: str
    effect: str

class FriendRequest(BaseModel):
    friend_username: str

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    return jwt.encode({'user_id': user_id, 'exp': exp}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        return None

def calculate_xp_for_level(level: int) -> int:
    return int(100 * (1.5 ** (level - 1)))

async def get_current_user(token: str) -> dict:
    if not token or not token.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    decoded = decode_token(token.split(' ')[1])
    if not decoded:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = await db.users.find_one({'id': decoded['user_id']}, {'_id': 0, 'password_hash': 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({'email': user_data.email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({'username': user_data.username}, {'_id': 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    password_hash = hash_password(user_data.password)
    
    user = User(
        email=user_data.email,
        username=user_data.username
    )
    
    user_dict = user.model_dump()
    user_dict['password_hash'] = password_hash
    
    await db.users.insert_one(user_dict)
    
    token = create_token(user.id)
    
    return {'token': token, 'user': user.model_dump()}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({'email': credentials.email})
    if not user_doc or not verify_password(credentials.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user_doc['id'])
    
    user_doc.pop('_id', None)
    user_doc.pop('password_hash', None)
    
    return {'token': token, 'user': user_doc}

# User Routes
@api_router.get("/user/profile")
async def get_profile(authorization: str = Header(None)):
    user = await get_current_user(authorization or "")
    return user

@api_router.put("/user/avatar")
async def update_avatar(avatar_data: Avatar, authorization: str = Header(None)):
    user = await get_current_user(authorization or "")
    
    await db.users.update_one(
        {'id': user['id']},
        {'$set': {'avatar': avatar_data.model_dump()}}
    )
    
    return {'message': 'Avatar updated successfully'}

@api_router.get("/user/stats")
async def get_stats(authorization: str = Header(None)):
    user = await get_current_user(authorization or "")
    
    completed_quests = await db.quests.count_documents({'user_id': user['id'], 'status': 'completed'})
    active_quests = await db.quests.count_documents({'user_id': user['id'], 'status': 'active'})
    
    return {
        'level': user['level'],
        'xp': user['xp'],
        'gold': user['gold'],
        'hp': user['hp'],
        'max_hp': user['max_hp'],
        'streak': user['streak'],
        'badges': user.get('badges', []),
        'completed_quests': completed_quests,
        'active_quests': active_quests,
        'xp_to_next_level': calculate_xp_for_level(user['level'] + 1) - user['xp']
    }

# Quest Routes
@api_router.post("/quests/create")
async def create_quest(quest_data: QuestCreate, authorization: str = Header(None)):
    user = await get_current_user(authorization or "")
    
    quest = Quest(
        user_id=user['id'],
        **quest_data.model_dump()
    )
    
    quest_dict = quest.model_dump()
    await db.quests.insert_one(quest_dict)
    
    return quest

@api_router.get("/quests/active")
async def get_active_quests(authorization: str = Header(None)):
    user = await get_current_user(authorization or "")
    
    quests = await db.quests.find(
        {'user_id': user['id'], 'status': 'active'},
        {'_id': 0}
    ).to_list(100)
    
    return quests

@api_router.get("/quests/completed")
async def get_completed_quests(authorization: str = Header(None)):
    user = await get_current_user(authorization or "")
    
    quests = await db.quests.find(
        {'user_id': user['id'], 'status': 'completed'},
        {'_id': 0}
    ).sort('completed_at', -1).to_list(50)
    
    return quests

@api_router.post("/quests/{quest_id}/complete")
async def complete_quest(quest_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization or "")
    
    quest = await db.quests.find_one({'id': quest_id, 'user_id': user['id']}, {'_id': 0})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    if quest['status'] != 'active':
        raise HTTPException(status_code=400, detail="Quest already completed")
    
    if quest.get('verification_required') and not quest.get('verification_data'):
        raise HTTPException(status_code=400, detail="Verification required")
    
    new_xp = user['xp'] + quest['xp_reward']
    new_gold = user['gold'] + quest['gold_reward']
    new_level = user['level']
    
    xp_needed = calculate_xp_for_level(new_level + 1)
    while new_xp >= xp_needed:
        new_level += 1
        xp_needed = calculate_xp_for_level(new_level + 1)
    
    today = datetime.now(timezone.utc).date().isoformat()
    new_streak = user['streak']
    if user.get('last_quest_date'):
        last_date = datetime.fromisoformat(user['last_quest_date']).date()
        if (datetime.now(timezone.utc).date() - last_date).days == 1:
            new_streak += 1
        elif (datetime.now(timezone.utc).date() - last_date).days > 1:
            new_streak = 1
    else:
        new_streak = 1
    
    await db.users.update_one(
        {'id': user['id']},
        {'$set': {
            'xp': new_xp,
            'gold': new_gold,
            'level': new_level,
            'streak': new_streak,
            'last_quest_date': today
        }}
    )
    
    await db.quests.update_one(
        {'id': quest_id},
        {'$set': {
            'status': 'completed',
            'completed_at': datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        'xp_gained': quest['xp_reward'],
        'gold_gained': quest['gold_reward'],
        'new_level': new_level,
        'level_up': new_level > user['level'],
        'new_streak': new_streak
    }
@api_router.post("/quests/generate")
async def generate_quest(category: str = "productivity", authorization: str = Header(None)):
    user = await get_current_user(authorization or "")

    # Local fallback quest generator (Emergent AI removed)
    quest = Quest(
        user_id=user['id'],
        title=f"{category.title()} Challenge",
        description=f"Complete one meaningful {category} task today.",
        quest_type="daily",
        difficulty="medium",
        xp_reward=100,
        gold_reward=25,
        category=category
    )

    quest_dict = quest.model_dump()
    await db.quests.insert_one(quest_dict)

    return quest

# @api_router.post("/quests/generate")
# async def generate_quest(category: str = "productivity", authorization: str = Header(None)):
#     user = await get_current_user(authorization or "")
    
#     try:
#         llm_key = os.getenv('EMERGENT_LLM_KEY')
#         chat = LlmChat(
#             api_key=llm_key,
#             session_id=f"quest_gen_{user['id']}",
#             system_message="You are a quest generator for a gamified life RPG. Generate a single realistic quest based on the category. Return ONLY a JSON object with: title, description, difficulty (easy/medium/hard), xp_reward (50-500), gold_reward (10-100), category."
#         ).with_model("gemini", "gemini-2.5-flash")
        
#         prompt = f"Generate a {category} quest for a level {user['level']} player."
#         response = await chat.send_message(UserMessage(text=prompt))
        
#         import json
#         quest_data = json.loads(response.strip().replace('```json', '').replace('```', ''))
        
#         quest = Quest(
#             user_id=user['id'],
#             title=quest_data['title'],
#             description=quest_data['description'],
#             quest_type='daily',
#             difficulty=quest_data['difficulty'],
#             xp_reward=quest_data['xp_reward'],
#             gold_reward=quest_data['gold_reward'],
#             category=quest_data['category']
#         )
        
#         quest_dict = quest.model_dump()
#         await db.quests.insert_one(quest_dict)
        
#         return quest
#     except Exception as e:
#         logging.error(f"Quest generation error: {e}")
#         raise HTTPException(status_code=500, detail="Failed to generate quest")

# Verification Routes
@api_router.post("/verification/photo")
async def submit_photo_verification(quest_id: str = Form(...), photo: UploadFile = File(...), authorization: str = Header(None)):
    user = await get_current_user(authorization or "")
    
    quest = await db.quests.find_one({'id': quest_id, 'user_id': user['id']}, {'_id': 0})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    contents = await photo.read()
    photo_base64 = base64.b64encode(contents).decode('utf-8')
    
    await db.quests.update_one(
        {'id': quest_id},
        {'$set': {
            'verification_required': True,
            'verification_type': 'photo',
            'verification_data': {'photo': photo_base64}
        }}
    )
    
    return {'message': 'Photo verification submitted'}
@api_router.post("/verification/quiz/generate")
async def generate_quiz(quest_id: str, notes: str, authorization: str = Header(None)):
    user = await get_current_user(authorization or "")

    quest = await db.quests.find_one({'id': quest_id, 'user_id': user['id']}, {'_id': 0})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Static quiz (AI removed)
    questions = [
        {
            "question": "Did you complete the task honestly?",
            "options": ["Yes", "No", "Partially", "Skipped"],
            "correct_answer": 0
        },
        {
            "question": "Did you understand what you worked on?",
            "options": ["Yes", "Somewhat", "No", "Not sure"],
            "correct_answer": 0
        },
        {
            "question": "Would you repeat this task tomorrow?",
            "options": ["Yes", "Maybe", "No", "Not sure"],
            "correct_answer": 0
        }
    ]

    await db.quests.update_one(
        {'id': quest_id},
        {'$set': {
            'verification_type': 'quiz',
            'verification_data': {
                'notes': notes,
                'questions': questions,
                'passed': False
            }
        }}
    )

    return {
        "questions": [
            {"question": q["question"], "options": q["options"]}
            for q in questions
        ]
    }

# @api_router.post("/verification/quiz/generate")
# async def generate_quiz(quest_id: str, notes: str, authorization: str = Header(None)):
#     user = await get_current_user(authorization or "")
    
#     quest = await db.quests.find_one({'id': quest_id, 'user_id': user['id']}, {'_id': 0})
#     if not quest:
#         raise HTTPException(status_code=404, detail="Quest not found")
    
#     try:
#         llm_key = os.getenv('EMERGENT_LLM_KEY')
#         chat = LlmChat(
#             api_key=llm_key,
#             session_id=f"quiz_gen_{user['id']}",
#             system_message="You are a quiz generator. Based on study notes, create 3 multiple choice questions. Return ONLY a JSON array with objects containing: question, options (array of 4 strings), correct_answer (0-3 index)."
#         ).with_model("gemini", "gemini-2.5-flash")
        
#         response = await chat.send_message(UserMessage(text=f"Create a quiz from these notes: {notes}"))
        
#         import json
#         questions = json.loads(response.strip().replace('```json', '').replace('```', ''))
        
#         await db.quests.update_one(
#             {'id': quest_id},
#             {'$set': {
#                 'verification_type': 'quiz',
#                 'verification_data': {
#                     'notes': notes,
#                     'questions': questions,
#                     'passed': False
#                 }
#             }}
#         )
        
#         return {'questions': [{'question': q['question'], 'options': q['options']} for q in questions]}
#     except Exception as e:
#         logging.error(f"Quiz generation error: {e}")
#         raise HTTPException(status_code=500, detail="Failed to generate quiz")

# @api_router.post("/verification/quiz/submit")
# async def submit_quiz(quiz_data: QuizAnswer, authorization: str = ""):
#     user = await get_current_user(authorization)
    
#     quest = await db.quests.find_one({'id': quiz_data.quest_id, 'user_id': user['id']}, {'_id': 0})
#     if not quest or not quest.get('verification_data'):
#         raise HTTPException(status_code=404, detail="Quiz not found")
    
#     questions = quest['verification_data']['questions']
#     score = sum(1 for i, answer in enumerate(quiz_data.answers) if int(answer) == questions[i]['correct_answer'])
#     passed = score >= 2
    
#     await db.quests.update_one(
#         {'id': quiz_data.quest_id},
#         {'$set': {
#             'verification_required': passed,
#             'verification_data.passed': passed,
#             'verification_data.score': score
#         }}
#     )
    
#     return {'passed': passed, 'score': score, 'total': len(questions)}

# Leaderboard
@api_router.get("/leaderboard")
async def get_leaderboard():
    users = await db.users.find(
        {},
        {'_id': 0, 'username': 1, 'level': 1, 'xp': 1, 'avatar.avatar_image': 1}
    ).sort('xp', -1).limit(50).to_list(50)
    
    return users

# Shop
@api_router.get("/shop/items")
async def get_shop_items():
    items = [
        ShopItem(name="Health Potion", description="Restore 50 HP", cost=50, item_type="consumable", effect="hp+50"),
        ShopItem(name="XP Boost", description="2x XP for next quest", cost=100, item_type="boost", effect="xp_x2"),
        ShopItem(name="Gold Multiplier", description="2x Gold for next quest", cost=150, item_type="boost", effect="gold_x2"),
        ShopItem(name="Streak Shield", description="Protect streak for 1 day", cost=200, item_type="protection", effect="streak_shield"),
    ]
    
    return [item.model_dump() for item in items]

# Friends
@api_router.post("/friends/add")
async def add_friend(friend_req: FriendRequest, authorization: str = ""):
    user = await get_current_user(authorization)
    
    friend = await db.users.find_one({'username': friend_req.friend_username}, {'_id': 0})
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.friends.insert_one({
        'id': str(uuid.uuid4()),
        'user_id': user['id'],
        'friend_id': friend['id'],
        'created_at': datetime.now(timezone.utc).isoformat()
    })
    
    return {'message': 'Friend added successfully'}

@api_router.get("/friends")
async def get_friends(authorization: str = ""):
    user = await get_current_user(authorization)
    
    friendships = await db.friends.find({'user_id': user['id']}, {'_id': 0}).to_list(100)
    friend_ids = [f['friend_id'] for f in friendships]
    
    friends = await db.users.find(
        {'id': {'$in': friend_ids}},
        {'_id': 0, 'username': 1, 'level': 1, 'xp': 1, 'avatar': 1}
    ).to_list(100)
    
    return friends

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

#uvicorn server:app --reload
# python -m uvicorn server:app --reload