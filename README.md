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

3. **Set up environment variables**:
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here

   # GitHub OAuth (required for authentication)
   GITHUB_ID=your-github-oauth-app-client-id
   GITHUB_SECRET=your-github-oauth-app-client-secret

   # GitHub Webhook (optional, for automatic commit tracking)
   GITHUB_WEBHOOK_SECRET=your-github-webhook-secret

   # Database (optional, defaults to dev.db)
   DATABASE_URL="file:./dev.db"
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

4. **Set up the database**:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Create an admin user** (optional):
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
- **Database**: SQLite with [Prisma](https://www.prisma.io)
- **Authentication**: [NextAuth.js](https://next-auth.js.org) with GitHub OAuth
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: [Radix UI](https://www.radix-ui.com)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
