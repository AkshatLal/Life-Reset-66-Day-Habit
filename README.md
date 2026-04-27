# Life Reset App

## How to set this up for free:

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Click "Add Project" and name it.
   - Go to "Build" -> "Authentication" -> "Get Started" -> Enable "Google".
   - Go to "Build" -> "Firestore Database" -> "Create Database" (Start in **Test Mode** for now).

2. **Get your Config Keys:**
   - Go to Project Settings (the gear icon top left).
   - Scroll down to "Your Apps" and click the web icon (`</>`).
   - Register the app and copy the `firebaseConfig` object.
   - Paste those keys into your `firebase-config.js` file.

3. **Deploy to GitHub Pages:**
   - Create a new public repository on GitHub.
   - Upload all these files into it.
   - Go to your repository "Settings" -> "Pages".
   - Under "Build and deployment", set the source to `Deploy from a branch` and select the `main` branch.
   - Save, wait 2 minutes, and your live URL will appear!

4. **Final Security Step (Crucial):**
   - Take your live GitHub Pages URL (e.g., `https://yourname.github.io`) and add it to the "Authorized domains" list in Firebase Authentication settings so Google login works on your live site.
