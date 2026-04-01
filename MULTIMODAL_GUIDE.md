# 🚀 AI Code Review Tool - Multimodal Edition

An intelligent, multi-expert AI code review tool with multimodal support for analyzing GitHub repositories, code files, documents, and images.

## ✨ Features

### 🔍 Multimodal Analysis
- **GitHub Repository Analysis**: Direct URL-based analysis with web search
- **GitHub API Enrichment**: Optional server-side repo metadata, README, and folder structure context
- **Document Upload**: Support for PDF, DOCX, MD, TXT formats (max 10MB)
- **Image Upload**: Support for JPG, PNG, GIF, WEBP, SVG formats
- **Combined Analysis**: Analyze multiple files and images together

### 📊 Smart Visualization
- **Repository Tree Diagram**: Visual representation of repository structure
- **Analysis Scores**: Comprehensive scoring for:
  - Code Quality
  - Security
  - Performance
  - Maintainability
  - Scalability

### 🤖 Multi-Expert Review
Six expert AI personas analyze your code simultaneously:
- 👨‍💻 **Code Quality Expert**
- 🔐 **Security Expert**
- ⚡ **Performance Expert**
- 🏗️ **Architecture Expert**
- 🧩 **Maintainability Expert**
- 🎯 **Product UX Expert**

## 🛠️ Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Google API Key (free or paid)

### Quick Setup (3 minutes)

👉 **See [QUICK_START.md](./QUICK_START.md) for step-by-step instructions**

### Environment Variables

Create a `.env.local` file in the root directory with **only API tokens**:

```env
# GitHub API Token (Optional)
VITE_GITHUB_API_TOKEN=your_github_personal_access_token_here

# Google API Key (Required)
VITE_GOOGLE_API_KEY=your_google_api_key_here
```

**Note:** API endpoints are hardcoded in `/src/config/apiConfig.js` - no need to set them in env files!

### Getting API Keys

#### 🐙 GitHub API Token (Optional)
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `user`, `gist`
4. Create and copy the token
5. Add to `.env.local`

#### 🔍 Google API Key (Required)
1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable Vision API and Generative AI API
3. Create an API key from credentials page
4. Add to `.env.local` as `VITE_GOOGLE_API_KEY`

### How It Works

The application uses a **local Vite proxy** that:
1. Accepts requests at `/api/review`
2. Forwards them to Google's Generative AI API
3. Converts the response format to match the expected output
4. Returns results to the frontend

This means:
- ✅ No sensitive API keys exposed to frontend
- ✅ Server-side request forwarding for security
- ✅ Automatic request/response transformation
- ✅ Works seamlessly with Google's API

**Required Google APIs:**
- Google Generative AI (for text generation)
- Google Vision API (for image analysis - optional)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Usage

### Option 1: Repository URL Analysis
1. Select "Repository URL" input mode
2. Choose a review model
3. Choose a GitHub review focus
4. Keep GitHub API enrichment enabled if you want repo metadata and folder structure pulled directly from GitHub
5. Enter a GitHub repository URL
6. (Optional) Add context about the project
7. Click "Analyze & Review"

**Example URLs:**
- https://github.com/expressjs/express
- https://github.com/vercel/next.js
- https://github.com/fastapi/fastapi

### Option 2: Multimodal File Analysis
1. Select "Multimodal (Files & Images)" input mode
2. Upload documents (PDF, DOCX, MD, TXT)
3. Upload screenshots or diagrams (JPG, PNG, GIF, etc.)
4. (Optional) Add context
5. Click "Analyze & Review"

## 📁 Project Structure

```
repo-reviewer/
├── src/
│   ├── components/
│   │   ├── CodeReviewTool.jsx       # Main review component
│   │   ├── MultimodalInput.jsx      # Multimodal input handler
│   │   ├── TreeDiagram.jsx          # Repository structure tree
│   │   └── ScoreBadge.jsx           # Analysis score display
│   ├── styles/
│   │   ├── CodeReviewTool.css       # Main styles
│   │   ├── MultimodalInput.css      # Input form styles
│   │   └── TreeDiagram.css          # Tree diagram styles
│   ├── utils/
│   │   └── markdownRenderer.jsx     # Markdown rendering
│   ├── config/
│   │   ├── systemPrompt.js          # AI system prompts
│   │   └── apiConfig.js             # API endpoints & app config (HARDCODED)
│   ├── App.jsx
│   └── main.jsx
├── .env.example                     # Environment variables template (tokens only)
├── .env.local                       # Local tokens (NOT committed)
├── package.json
└── vite.config.js
```

## 🎨 Supported Input Formats

### Documents
- **PDF** (.pdf)
- **Word Documents** (.docx)
- **Markdown** (.md)
- **Plain Text** (.txt)

### Images
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **WebP** (.webp)
- **SVG** (.svg)

**Max file size:** 10MB per file

## 📊 Analysis Output

The tool provides:

1. **Repository Structure Tree**
   - Visual file hierarchy
   - File types and sizes
   - Language indicators

2. **Analysis Scores**
   - Numeric ratings (0-10) for each category
   - Color-coded indicators (green ≥8, yellow ≥6, red <6)

3. **Detailed Report**
   - Code quality insights
   - Security vulnerabilities
   - Performance bottlenecks
   - Architecture recommendations
   - Maintainability suggestions
   - UX feedback

4. **PDF Export**
   - Download the current review as a PDF
   - Includes the report content and nested JSON folder structure when available

## 🔄 API Integration

The tool uses proxy API endpoints for secure handling:

```javascript
// Repository Review
POST /api/review
{
  "model": "gemini-2.5-flash-lite",
  "max_tokens": 4000,
  "system": "system_prompt_here",
  "tools": [{ "type": "web_search_20250305", "name": "web_search" }],
  "messages": [{ "role": "user", "content": "..." }]
}
```

## 🎨 Customization

### System Prompts
Edit `src/config/systemPrompt.js` to customize analysis criteria and output format.

### API Endpoints & Configuration
Edit `src/config/apiConfig.js` to modify:
- API endpoints (e.g., Vision API or Generative AI API versions)
- Max file size limit
- Supported file formats
- App configuration

### Styling
- Global styles: `src/styles/CodeReviewTool.css`
- Input styles: `src/styles/MultimodalInput.css`
- Tree styles: `src/styles/TreeDiagram.css`

## 🚀 Performance Tips

1. **Large Repositories**: Add context about what to focus on
2. **Multiple Files**: 3-5 files provide good analysis without timeouts
3. **Images**: Screenshots of error messages or UI are most helpful
4. **Cache**: Reports are generated on-the-fly; refresh for latest analysis

## 🐛 Troubleshooting

### "JSON.parse: unexpected end of data"
**This error occurs when the API proxy is not configured correctly.**

**Solution:**
1. Ensure `VITE_GOOGLE_API_KEY` is set in `.env.local`
2. Restart the dev server after updating `.env.local`
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```
3. Verify the Google API key is valid and has the following enabled:
   - ✅ Google Generative AI API
   - ✅ Enough quota/credits

### "API endpoint not configured"
- Make sure `.env.local` has `VITE_GOOGLE_API_KEY`
- Check that the dev server is running on `http://localhost:5173`
- Verify no firewall is blocking the requests

### "API request failed"
- Check `.env.local` has correct API keys
- Restart dev server after changing env vars
- Verify API key permissions and quotas
- Check that Google APIs are enabled in your project

### Tree structure not showing
- Not all analyses generate tree structures
- Large repositories may not include tree data
- Check browser console for parsing errors
- This is optional - reports work fine without trees

### File upload failing
- Verify file size is under 10MB
- Check file format is supported
- Ensure browser allows file access

### Images not uploading
- Confirm image format is supported
- Try converting to PNG or JPG
- Check file permissions

## 📚 Learn More

- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [Google Generative AI API](https://ai.google.dev)
- [GitHub API Reference](https://docs.github.com/en/rest)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)

## 📝 License

MIT License - feel free to use this tool for your projects!

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues and questions:
- Check existing [GitHub Issues](https://github.com/yourusername/repo-reviewer/issues)
- Create a new issue with details
- Include `.env.example` content (not secrets!)
- Describe the error and steps to reproduce
