# Privy - The Private AI Coach for Founders & Leaders

A radically private AI performance coaching platform built with the Vercel AI Chatbot SDK.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Fireworks AI API key

### Installation

```bash
# Clone the repo
git clone https://github.com/privyai/privy-mvp.git
cd privy-mvp

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Set up database
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `FIREWORKS_API_KEY` | Your Fireworks AI API key |
| `POSTGRES_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Secret for authentication (generate with `openssl rand -base64 32`) |

## Features

- **Three Coaching Modes**:
  - **Vent**: Safe space for emotional decompression
  - **Decision Lab**: Structured decision-making frameworks
  - **Reframe**: Perspective shifting and mental clarity

- **Radical Privacy**:
  - No real names or emails required
  - Burn-after-session option
  - Anonymous by default

- **Premium Tier** (planned):
  - Persistent memory
  - Unlimited messages
  - Token-based authentication

## Tech Stack

- Next.js 16 + React 19
- Vercel AI SDK
- Fireworks AI (gemma-3-4b-it model)
- PostgreSQL + Drizzle ORM
- Tailwind CSS + shadcn/ui
- Auth.js (NextAuth)

## License

MIT
