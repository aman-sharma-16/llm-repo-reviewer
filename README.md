# 🚀 Quick Start Guide

### ✅ Step 1: Get Your Google API Key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable these APIs:
   - **Google Generative AI API** (required for text analysis)
   - **Google Vision API** (optional, for image analysis)
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### ✅ Step 2: Add the API Key to `.env.local`

**IMPORTANT:** Replace `your_google_api_key_here` with your actual Google API key!

```bash
# Open the file
cat > .env.local << 'EOF'
# ============================================
# API Tokens Only (Google-based)
# ============================================

# GitHub API Token (Optional)
# Get from: https://github.com/settings/tokens
VITE_GITHUB_API_TOKEN="your_github_token_here"

# Google API Key (Required for code analysis)
# Get from: https://console.cloud.google.com
VITE_GOOGLE_API_KEY=YOUR_ACTUAL_GOOGLE_API_KEY_HERE
EOF
``` 

**Or edit the file manually:**
```env
VITE_GOOGLE_API_KEY=AIzaSy...your_key_here...
```

### ✅ Step 3: Stop and Restart the Dev Server

```bash
# Stop the current server (press Ctrl+C)

# Then restart it
npm run dev
```

**⚠️ IMPORTANT:** You MUST restart the server after updating `.env.local` for the changes to take effect!

### ✅ Step 4: Test the API

1. Open [http://localhost:5173](http://localhost:5173) in your browser
2. Select an input mode:
   - Enter a GitHub repository URL, OR
   - Upload code files/images
3. Choose a review model
4. If you're reviewing a GitHub repository, choose a GitHub review focus
5. Leave "Use GitHub API context" enabled if you want repo metadata, README content, and folder structure pulled from GitHub during review
6. Click "Analyze & Review"
7. Wait for the response (first request may take 10-30 seconds)

## 🐛 If You Still Get a 404 Error

### Debug Checklist:

1. **Check `.env.local` has the key:**
   ```bash
   # In terminal:
   cat .env.local | grep VITE_GOOGLE_API_KEY
   ```
   Should output: `VITE_GOOGLE_API_KEY=AIzaSy...`

2. **Verify the dev server is running:**
   - Look for: `➜ Local: http://localhost:5173/`
   - If not running, execute: `npm run dev`

3. **Check browser console for errors:**
   - Press `F12` or `Ctrl+Shift+I`
   - Go to **Console** tab
   - Look for red error messages
   - Copy any error messages for troubleshooting

4. **Check terminal output for API logs:**
   - Look for `📤 Sending request to Google API...`
   - Or errors starting with `❌`

5. **Verify API key is valid:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Check the API key is still active
   - Verify quota/usage hasn't been exceeded

## 📝 Example Configuration

## 🔗 Useful Links

- [Google Cloud Console](https://console.cloud.google.com)
- [Enable Google Generative AI API](https://console.cloud.google.com/marketplace/product/google/generativeapi)
- [Get Google API Key](https://console.cloud.google.com/apis/credentials)
- [GitHub Personal Access Tokens](https://github.com/settings/tokens)

## 💡 Common Issues

| Issue | Solution |
|-------|----------|
| 404 Not Found | Restart dev server after adding API key |
| Missing VITE_GOOGLE_API_KEY | Add key to `.env.local` and restart |
| API Key invalid | Regenerate from Google Cloud Console |
| Quota exceeded | Check usage in Google Cloud Console |
| No response | First request takes longer (10-30 sec) |

## ✨ Once It's Working

You can:
- ✅ Analyze GitHub repositories
- ✅ Choose the Gemini model used for each review
- ✅ Choose a GitHub-specific review focus
- ✅ Use your GitHub API token to enrich repository reviews
- ✅ Review code files
- ✅ Analyze images and documents
- ✅ Get detailed code reviews with scores
- ✅ See repository structure trees
- ✅ Download the review report as a PDF

**Happy coding!** 🎉
