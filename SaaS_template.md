# SaaS Application Setup Template

This template provides a comprehensive guide for setting up a full-stack SaaS application with a Python backend and Next.js frontend, using Supabase for authentication and database services.

## 📁 Project Structure Setup

### 1. Initialize Git Repository
```bash
git init your-saas-project
cd your-saas-project
mkdir backend frontend
git add .
git commit -m "Initial project structure"
```

## 🔧 Backend Setup (Python with FastAPI)

### 2. Initialize Python Project
```bash
cd backend
uv init
```

This creates a Python project using UV package manager for dependency management.

### 3. Backend Environment Variables
Create a `.env` file in the backend directory with the following variables:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
SUPABASE_URL=https://your-project.supabase.co
FRONTEND_URL=http://localhost:3000  # For local development, update for production
```

**Note**: The service role key and JWT secret can be found in your Supabase project settings under API.

## 🌐 Frontend Setup (Next.js with TypeScript)

### 4. Initialize Next.js Application
```bash
cd frontend
npx create-next-app@latest . --ts --tailwind --eslint --app
```

### 5. Install Required Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-ui-react
```

### 6. Frontend Environment Variables
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Note**: These values are found in your Supabase project settings under API. The anon key is safe to expose in the frontend.

## ☁️ Deployment Setup

### 7. Frontend Deployment (Vercel)
1. Go to [Vercel](https://vercel.com)
2. Create a new project
3. Connect your GitHub repository
4. Set the root directory to `frontend`
5. Add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Deploy the application

### 8. Backend Deployment (Railway)
1. Go to [Railway](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Set the root directory to `backend`
5. Add the following environment variables:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `SUPABASE_URL`
   - `FRONTEND_URL` (set to your Vercel domain)
6. Deploy the application

## 👤 User Management

### 9. Create Initial User Account
1. Navigate to your deployed frontend login page
2. Use the registration form to create the first user account
3. **Important**: Save the login credentials securely (use macOS Keychain or a password manager)
4. Verify the user account through email if email confirmation is enabled

## 🔄 Preview Deployments for Pull Requests

### 10. Configure PR Preview Environments
Set up automatic preview deployments for both frontend and backend when creating pull requests. This allows testing changes in isolation before merging to main.

#### Railway Backend PR Previews:
1. In your Railway project dashboard, navigate to your backend service settings
2. Find the "Deployments" or "PRs" section and enable "PR/Branch Deploys"
3. Note your Railway service name (visible in settings or production URL)
4. Railway will automatically create preview deployments with URLs like: `https://your-service-name-pr-123.up.railway.app`

#### Vercel Frontend PR Previews:
1. In your Vercel project settings, go to "Environment Variables"
2. **Enable System Environment Variables**:
   - Check "Automatically expose System Environment Variables"
3. **Set up Production environment variables**:
   - `NEXT_PUBLIC_ENVIRONMENT` = `prod`
   - `NEXT_PUBLIC_API_URL` = `https://your-service-name-production.up.railway.app`
4. **Set up Preview environment variables**:
   - `NEXT_PUBLIC_ENVIRONMENT` = `preview`
   - (No need to set `NEXT_PUBLIC_API_URL` for preview - it will be constructed dynamically)
5. **Update your API client code** to use the environment variable:

```typescript
// In your API client (e.g., lib/api.ts)
function getApiUrl(): string {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT

  // For production environment, use the explicit API URL
  if (environment === 'prod' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // For preview environment, construct the URL dynamically using PR ID
  if (environment === 'preview' && process.env.VERCEL_GIT_PULL_REQUEST_ID) {
    // Replace 'your-service-name' with your actual Railway service name
    const railwayServiceName = 'your-service-name'
    return `https://${railwayServiceName}-pr-${process.env.VERCEL_GIT_PULL_REQUEST_ID}.up.railway.app`
  }

  // Fallback: try to use explicit API URL if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // Final fallback to localhost for development
  return 'http://localhost:8000'
}

const API_URL = getApiUrl()
```

#### CORS Configuration:
Your backend should already include this CORS configuration in `app.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",  # Allows all Vercel preview deployments
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Testing the Setup:
1. Create a new branch and make changes
2. Push to GitHub and open a pull request
3. Both Railway and Vercel will automatically deploy previews
4. Vercel will comment on your PR with the frontend preview URL
5. The preview frontend will automatically connect to the corresponding backend preview

## 🔐 Security Considerations

- Never commit `.env` files to version control
- Use different environment variables for development, staging, and production
- Regularly rotate API keys and secrets
- Enable Row Level Security (RLS) in Supabase for data protection
- Configure proper CORS settings in your backend

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Railway Deployment Guide](https://docs.railway.app/)

## 🚀 Next Steps

After completing this setup:
1. Configure your database schema in Supabase
2. Set up authentication flows and protected routes
3. Implement your core application features
4. Set up monitoring and analytics
5. Configure backup and disaster recovery procedures