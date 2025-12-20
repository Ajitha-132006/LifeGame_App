import requests
import sys
import json
import base64
from datetime import datetime
import time

class LifeRPGAPITester:
    def __init__(self, base_url="http://localhost:8000/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.quest_id = None
        self.test_results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if files:
                # Remove Content-Type for file uploads
                headers.pop('Content-Type', None)
                
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, headers=headers, files=files, data=data)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            
            if success:
                self.log_result(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text}"
                self.log_result(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_result(name, False, f"Connection error: {str(e)}")
            return False, {}

    def test_auth_register(self):
        """Test user registration"""
        timestamp = int(time.time())
        test_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "username": f"test_user_{timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_auth_login(self):
        """Test user login with existing credentials"""
        # Try to login with a test account
        test_data = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login (Test Account)",
            "POST",
            "auth/login",
            200,
            data=test_data
        )
        
        # If test account doesn't exist, that's expected
        if not success:
            print("   Note: Test account doesn't exist, which is expected for first run")
        
        return True  # Don't fail the test suite for this

    def test_user_profile(self):
        """Test getting user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "user/profile",
            200
        )
        return success

    def test_user_stats(self):
        """Test getting user stats"""
        success, response = self.run_test(
            "Get User Stats",
            "GET",
            "user/stats",
            200
        )
        return success

    def test_avatar_update(self):
        """Test avatar update"""
        avatar_data = {
            "avatar_class": "warrior",
            "avatar_image": "https://images.unsplash.com/photo-1750092701416-174aaa737e55",
            "name": "Test Warrior"
        }
        
        success, response = self.run_test(
            "Update Avatar",
            "PUT",
            "user/avatar",
            200,
            data=avatar_data
        )
        return success

    def test_quest_creation(self):
        """Test manual quest creation"""
        quest_data = {
            "title": "Test Quest",
            "description": "A test quest for API testing",
            "quest_type": "daily",
            "difficulty": "medium",
            "xp_reward": 100,
            "gold_reward": 50,
            "category": "productivity"
        }
        
        success, response = self.run_test(
            "Create Quest",
            "POST",
            "quests/create",
            200,
            data=quest_data
        )
        
        if success and 'id' in response:
            self.quest_id = response['id']
        
        return success

    def test_ai_quest_generation(self):
        """Test AI quest generation"""
        success, response = self.run_test(
            "AI Quest Generation",
            "POST",
            "quests/generate?category=productivity",
            200
        )
        
        if success and 'id' in response:
            # Store another quest ID for testing
            if not self.quest_id:
                self.quest_id = response['id']
        
        return success

    def test_get_active_quests(self):
        """Test getting active quests"""
        success, response = self.run_test(
            "Get Active Quests",
            "GET",
            "quests/active",
            200
        )
        return success

    def test_get_completed_quests(self):
        """Test getting completed quests"""
        success, response = self.run_test(
            "Get Completed Quests",
            "GET",
            "quests/completed",
            200
        )
        return success

    def test_photo_verification(self):
        """Test photo verification upload"""
        if not self.quest_id:
            self.log_result("Photo Verification", False, "No quest ID available")
            return False
        
        # Create a simple test image (1x1 pixel PNG)
        test_image_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
        
        files = {'photo': ('test.png', test_image_data, 'image/png')}
        data = {'quest_id': self.quest_id}
        
        success, response = self.run_test(
            "Photo Verification Upload",
            "POST",
            "verification/photo",
            200,
            data=data,
            files=files
        )
        return success

    def test_quiz_generation(self):
        """Test quiz generation"""
        if not self.quest_id:
            self.log_result("Quiz Generation", False, "No quest ID available")
            return False
        
        test_notes = "Python is a programming language. Variables store data. Functions perform operations."
        
        success, response = self.run_test(
            "Quiz Generation",
            "POST",
            f"verification/quiz/generate?quest_id={self.quest_id}&notes={test_notes}",
            200
        )
        return success

    def test_quest_completion(self):
        """Test quest completion"""
        if not self.quest_id:
            self.log_result("Quest Completion", False, "No quest ID available")
            return False
        
        success, response = self.run_test(
            "Complete Quest",
            "POST",
            f"quests/{self.quest_id}/complete",
            200
        )
        return success

    def test_leaderboard(self):
        """Test leaderboard endpoint"""
        success, response = self.run_test(
            "Get Leaderboard",
            "GET",
            "leaderboard",
            200
        )
        return success

    def test_shop_items(self):
        """Test shop items endpoint"""
        success, response = self.run_test(
            "Get Shop Items",
            "GET",
            "shop/items",
            200
        )
        return success

    def test_friends_functionality(self):
        """Test friends functionality"""
        # Test getting friends list
        success1, response1 = self.run_test(
            "Get Friends List",
            "GET",
            "friends",
            200
        )
        
        # Test adding a friend (this will likely fail as the user doesn't exist)
        friend_data = {"friend_username": "nonexistent_user"}
        success2, response2 = self.run_test(
            "Add Friend (Expected to Fail)",
            "POST",
            "friends/add",
            404,  # Expecting 404 for non-existent user
            data=friend_data
        )
        
        return success1 and success2

def main():
    print("🚀 Starting Life RPG API Testing...")
    print("=" * 60)
    
    tester = LifeRPGAPITester()
    
    # Test sequence
    tests = [
        ("Authentication & User Setup", [
            tester.test_auth_register,
            tester.test_auth_login,
            tester.test_user_profile,
            tester.test_user_stats,
            tester.test_avatar_update,
        ]),
        ("Quest Management", [
            tester.test_quest_creation,
            tester.test_ai_quest_generation,
            tester.test_get_active_quests,
            tester.test_get_completed_quests,
        ]),
        ("Verification System", [
            tester.test_photo_verification,
            tester.test_quiz_generation,
        ]),
        ("Quest Completion", [
            tester.test_quest_completion,
        ]),
        ("Social Features", [
            tester.test_leaderboard,
            tester.test_shop_items,
            tester.test_friends_functionality,
        ])
    ]
    
    # Run all tests
    for category, test_functions in tests:
        print(f"\n📋 {category}")
        print("-" * 40)
        
        for test_func in test_functions:
            try:
                test_func()
            except Exception as e:
                print(f"❌ {test_func.__name__} - ERROR: {str(e)}")
                tester.tests_run += 1
        
        time.sleep(1)  # Brief pause between categories
    
    # Print final results
    print("\n" + "=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%" if tester.tests_run > 0 else "0%")
    
    # Print failed tests
    failed_tests = [result for result in tester.test_results if not result['success']]
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   • {test['test']}: {test['details']}")
    
    # Return appropriate exit code
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())