# Environment Variables Template

Copy this content to create your `.env` file in the project root.

```bash
# ===================================
# VOICE TO TABLES - ENVIRONMENT VARIABLES
# ===================================

# ---------------
# Google Gemini API
# ---------------
# Get your API key at: https://aistudio.google.com/apikey
# Used for: Gemini 2.0 Flash Live API (voice processing and table generation)
API_KEY=your_gemini_api_key_here

# ---------------
# Convex Backend
# ---------------
# Get your deployment URL by running: npx convex dev
# Format: https://your-deployment-name.convex.cloud
# Used for: Real-time database, message storage, table persistence
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# ---------------
# Clerk Authentication
# ---------------
# Get your publishable key from: https://dashboard.clerk.com
# Format: pk_test_... (development) or pk_live_... (production)
# Used for: User authentication across Web, iOS, and Android
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# ---------------
# Optional: Future Integrations
# ---------------

# Anthropic Claude API (Planned)
# ANTHROPIC_API_KEY=your_anthropic_key_here

# OpenAI API (Planned)
# OPENAI_API_KEY=your_openai_key_here

# ElevenLabs TTS API (Planned)
# ELEVENLABS_API_KEY=your_elevenlabs_key_here

# x402 Payments (Planned)
# X402_API_KEY=your_x402_key_here

# ---------------
# Development Settings
# ---------------

# Environment mode (development, production)
# VITE_ENV=development

# Enable debug logging
# VITE_DEBUG=true
```

## Setup Instructions

1. **Create your .env file:**
   ```bash
   cp ENV_TEMPLATE.md .env
   # Then edit .env and remove the markdown formatting
   ```

2. **Get your Gemini API key:**
   - Visit https://aistudio.google.com/apikey
   - Create a new API key
   - Add to `.env` as `API_KEY=...`

3. **Set up Convex:**
   ```bash
   npx convex dev
   ```
   - Copy the deployment URL shown
   - Add to `.env` as `VITE_CONVEX_URL=...`

4. **Set up Clerk:**
   - Visit https://dashboard.clerk.com
   - Create a new application
   - Copy the publishable key
   - Add to `.env` as `VITE_CLERK_PUBLISHABLE_KEY=...`

5. **Verify setup:**
   - Ensure `.env` is listed in `.gitignore`
   - Never commit `.env` to version control
   - For production, set these in your hosting platform's environment settings

