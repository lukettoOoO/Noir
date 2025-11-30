---
description: How to deploy the Noir application to Vercel
---

# Deploying Noir to Vercel

Since the Vercel CLI is not installed, the easiest way to deploy is through the Vercel Dashboard.

## Prerequisites
- A [Vercel Account](https://vercel.com/signup)
- A [GitHub Account](https://github.com) (which you have)
- The project pushed to GitHub (which we just did)

## Step 1: Import Project to Vercel
1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Select your GitHub repository: `lukettoOoO/Noir`.
4.  Click **"Import"**.

## Step 2: Configure Project
1.  **Framework Preset**: It should auto-detect **Next.js**.
2.  **Root Directory**: Leave as `./`.
3.  **Build and Output Settings**: Leave default.

## Step 3: Environment Variables
Expand the **"Environment Variables"** section and add the following keys. You can copy the values from your local `.env.local` file (except for the database URL, see Step 4).

| Key | Value |
| :--- | :--- |
| `GEMINI_API_KEY` | *(Your Gemini API Key)* |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | *(Your Clerk Publishable Key)* |
| `CLERK_SECRET_KEY` | *(Your Clerk Secret Key)* |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/game` |

## Step 4: Database Setup (Vercel Postgres)
1.  In the deployment screen (or after creating the project), go to the **Storage** tab.
2.  Click **"Connect Store"** -> **"Postgres"** -> **"Create New"**.
3.  Accept the terms and create the database (e.g., "noir-db").
4.  Once created, Vercel will automatically add the necessary environment variables (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, etc.) to your project.
5.  **Important**: You need to update your `prisma/schema.prisma` to use these variables if it doesn't already, OR simply map `PRISMA_DATABASE_URL` to one of them in the Environment Variables UI.
    - **Recommended**: In Vercel Environment Variables, add a new variable:
    - Key: `PRISMA_DATABASE_URL`
    - Value: Reference the system environment variable `POSTGRES_PRISMA_URL` (or copy its value).

## Step 5: Deploy
1.  Click **"Deploy"**.
2.  Wait for the build to complete.

## Step 6: Post-Deployment Setup
1.  **Run Migrations**: You might need to run Prisma migrations on the production DB.
    - You can do this by connecting to your Vercel project locally: `vercel link` (requires CLI)
    - OR, simpler: Go to your Clerk Dashboard.
2.  **Clerk Configuration**:
    - Go to your [Clerk Dashboard](https://dashboard.clerk.com/).
    - Navigate to **API Keys**.
    - Ensure the keys match what you put in Vercel.
    - Go to **Paths** (or Customization) and ensure the redirect URLs match your production domain (e.g., `https://noir-app.vercel.app/` and `https://noir-app.vercel.app/game`).

## Troubleshooting
- If the build fails on `prisma generate`, ensure `PRISMA_DATABASE_URL` is set.
- If the app shows a database error, ensure you've run `npx prisma db push` against the production database URL (you can temporarily set `PRISMA_DATABASE_URL` in your local `.env` to the production URL to push the schema, then switch it back).
