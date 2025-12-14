# VC Hackathon Hub

A web tool for university course hackathons where students enroll, connect their GitHub repositories, upload required data, and have their progress automatically tracked via commits and milestones—culminating in a leaderboard and optional final pitch voting.

## Features

- **Student Enrollment**: Students can enroll and connect their GitHub repositories
- **Milestone Tracking**: Automatic progress tracking based on commit message labels (e.g., `#M1`, `#M2`)
- **Live Leaderboard**: Real-time visibility of student progress during the hackathon
- **Voting System**: Optional final pitch voting for hackathon participants
- **Admin Dashboard**: Professors can create milestones, monitor progress, and manage voting

## Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** or **pnpm** or **bun**
- **GitHub Account** (for OAuth authentication)
- **GitHub OAuth App** (for authentication setup)
- **Supabase Account** (for PostgreSQL database)

## Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd vc_hackathon_hub
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up Supabase Database**:
   
   - Go to [supabase.com](https://supabase.com) and create an account/login
   - Click "New Project" and fill in project details (name, database password, region)
   - Wait for project creation (~2 minutes)
   - Go to Settings → Database → Connection string
   - Select "URI" tab and copy the connection string
   - **For production/serverless (Vercel)**: Use the "Connection pooling" URI with `?pgbouncer=true&connection_limit=1` parameters

4. **Set up environment variables**:
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Supabase Database (use connection pooling URI for production/serverless)
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here

   # GitHub OAuth (required for authentication)
   GITHUB_ID=your-github-oauth-app-client-id
   GITHUB_SECRET=your-github-oauth-app-client-secret

   # GitHub Webhook (optional, for automatic commit tracking)
   GITHUB_WEBHOOK_SECRET=your-github-webhook-secret
   ```

   **Generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

   **Setting up GitHub OAuth:**
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create a new OAuth App
   - Set Authorization callback URL to: `http://localhost:3000/api/auth/callback/github`
   - Copy the Client ID and Client Secret to your `.env` file

   **Setting up GitHub Webhook (optional):**
   - In your GitHub repository settings, add a webhook
   - Set the webhook URL to: `http://localhost:3000/api/webhooks/github` (or your production URL)
   - Set the webhook secret and add it to your `.env` file

5. **Set up the database**:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

6. **Create an admin user** (optional):
   ```bash
   npm run tsx scripts/make-admin.ts <user-email>
   ```

## Usage

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Production Build

Build the application for production:

```bash
npm run build
npm start
```

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run migrate:deploy` - Run database migrations in production

### User Roles

- **STUDENT**: Default role for enrolled users. Can view milestones, track progress, and vote.
- **ADMIN**: Can create/edit milestones, monitor progress, and manage voting. Use the `make-admin.ts` script to assign admin role.

### Key Pages

- `/` - Home page
- `/dashboard` - Student dashboard with milestone progress
- `/leaderboard` - Live leaderboard showing student rankings
- `/vote` - Voting page (when voting is enabled)
- `/profile` - User profile page
- `/admin` - Admin dashboard (admin only)

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org) 16
- **Database**: PostgreSQL with [Supabase](https://supabase.com) and [Prisma](https://www.prisma.io)
- **Authentication**: [NextAuth.js](https://next-auth.js.org) with GitHub OAuth
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: [Radix UI](https://www.radix-ui.com)

## Deployment

### Deploying to Vercel

1. **Push your code to GitHub** (if not already done)

2. **Create Vercel Account/Login**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub

3. **Import Project**:
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

4. **Configure Environment Variables**:
   In Vercel project settings → Environment Variables, add:
   - `DATABASE_URL` - Supabase connection string (use pooling URI with `?pgbouncer=true&connection_limit=1`)
   - `NEXTAUTH_URL` - Your Vercel URL (e.g., `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET` - Same secret from your `.env` file
   - `GITHUB_ID` - Your GitHub OAuth Client ID
   - `GITHUB_SECRET` - Your GitHub OAuth Client Secret
   - `GITHUB_WEBHOOK_SECRET` - If using webhooks

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

6. **Run Production Migrations**:
   After first deployment, run migrations:
   ```bash
   npx prisma migrate deploy
   ```
   Or add to Vercel's build command: `npm run build && npx prisma migrate deploy`

7. **Update GitHub OAuth**:
   - Add production callback URL: `https://your-app.vercel.app/api/auth/callback/github`
   - Update GitHub webhook URL if using: `https://your-app.vercel.app/api/webhooks/github`

8. **Test Production**:
   - Visit your Vercel URL
   - Test authentication and database operations
   - Create admin user if needed: `npx tsx scripts/make-admin.ts your-email@example.com`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
