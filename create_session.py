import instaloader

username = "day_dreamer_9001"
password = input("Enter your Instagram password (will not be saved): ")

try:
    L = instaloader.Instaloader()
    L.login(username, password)
    L.save_session_to_file()
    print("✅ Session created and saved successfully!")
except Exception as e:
    print("❌ Login failed:", e)
