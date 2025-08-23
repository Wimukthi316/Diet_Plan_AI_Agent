"""
Test script to verify Gemini AI functionality
"""
import asyncio
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

async def test_gemini():
    """Test Gemini AI functionality"""
    
    # Configure Gemini
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment")
        return False
    
    print(f"✅ Found API key: {api_key[:10]}...")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        print("🔄 Testing Gemini API...")
        response = model.generate_content("Explain the nutrition benefits of a banana in 2 sentences.")
        
        if response and hasattr(response, 'text') and response.text:
            print("✅ Gemini API is working!")
            print(f"Response: {response.text}")
            return True
        else:
            print("❌ No response from Gemini API")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Gemini API: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_gemini())
    if result:
        print("\n🎉 All tests passed! The agents should work correctly now.")
    else:
        print("\n⚠️  Please check your Gemini API key configuration.")
