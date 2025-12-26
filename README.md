# Privy - The Private AI Coach for Founders & Leaders

<div align="center">

**A radically private AI performance coaching platform for high-stakes leadership**

[![License: MIT](https://img.shields.io/badge/License-MIT-FF6B35.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Privacy First](https://img.shields.io/badge/Privacy-First-FF6B35.svg)](#)

[Live Demo](https://privy.ai) • [Documentation](#) • [Report Bug](https://github.com/privyai/privy-mvp/issues)

</div>

---

## The Problem

Leaders face an impossible paradox: they carry immense pressure but have nowhere safe to process it. Every conversation risks judgment, politics, or exposure. Traditional coaching is expensive, slow, and often documented. Mental health platforms miss the mark for performance-focused executives.

**Privy solves this** by providing a completely private, instant AI coach that understands the unique pressures of leadership—no names, no emails, no paper trail.

---

## Features

### Three Specialized Coaching Modes

#### Vent Mode
**Purpose**: Emotional decompression without judgment

A safe space for leaders to process stress, frustration, and overwhelm without fear of appearing weak or incompetent.

**Key Capabilities**:
- Deep listening and emotional validation
- Zero unsolicited advice (unless explicitly requested)
- Grounding techniques for high-stress moments
- Non-reactive, confidential processing

**When to Use**: After a brutal board meeting, team conflict, or when you just need someone to listen.

#### Decision Lab Mode
**Purpose**: Structured analysis of complex choices

Transform messy, high-stakes decisions into clear, well-reasoned choices using battle-tested frameworks.

**Key Frameworks**:
- **Reversibility Analysis**: How reversible is this decision?
- **Regret Minimization**: What will you regret more in 10 years?
- **Stakeholder Mapping**: Who else is affected and how?
- **Second-Order Thinking**: What happens immediately? Then what?
- **Pre-mortem Analysis**: If this fails, what went wrong?

**When to Use**: Major hires, pivots, fundraising decisions, or strategic crossroads.

#### Reframe Mode
**Purpose**: Mental performance coaching and perspective shifting

Help leaders identify cognitive distortions, regain clarity under pressure, and build mental resilience.

**Key Techniques**:
- **Zoom Out**: "What will this look like in 6 months?"
- **Control Filter**: "What part of this can you actually influence?"
- **Evidence Check**: "What evidence supports or contradicts this worry?"
- **Worst Case Scenario**: "What's the actual worst case, and could you handle it?"
- **Values Anchor**: "What matters most to you here?"

**When to Use**: Catastrophizing, burnout risk, imposter syndrome, or mental fog.

---

### Radical Privacy

Privacy isn't a feature—it's the foundation. Privy is built for leaders who need complete confidentiality.

**Privacy Guarantees**:
- **Anonymous by Default**: No real names or emails required
- **Guest Mode**: Start chatting immediately with zero account creation
- **Burn After Session**: Optional auto-deletion of conversations
- **No Tracking**: Location data intentionally not collected
- **Local First**: Sessions stored client-side by default
- **No Personal Data**: Deliberately designed to avoid storing identifying information

**Technical Privacy**:
- End-to-end encrypted database connections
- Minimal logging (only errors, no content)
- OpenTelemetry observability without PII
- Optional anonymous telemetry for product improvements

---

### Premium Tier (Planned)

- **Persistent Memory**: Context across sessions
- **Unlimited Messages**: No rate limits
- **Priority Access**: Faster response times
- **Advanced Frameworks**: Additional coaching methodologies
- **Session Analytics**: Private insights on your patterns (only you can see)

---

## Tech Stack

**Why These Choices?**

| Technology | Purpose | Why We Chose It |
|------------|---------|----------------|
| **Next.js 16** | Full-stack framework | App Router, React Server Components, optimal for AI chat UX |
| **Vercel AI SDK** | AI orchestration | Best-in-class streaming, tool calling, and model abstraction |
| **Fireworks AI** | LLM inference | Fast, cost-effective, privacy-focused (Gemma 3.4B model) |
| **PostgreSQL** | Database | ACID compliance for critical user data |
| **Drizzle ORM** | Database toolkit | Type-safe, migration-friendly, minimal overhead |
| **Auth.js v5** | Authentication | Industry standard, supports guest sessions |
| **Tailwind + shadcn/ui** | UI framework | Rapid development, accessible components |
| **Logfire** | Observability | OpenTelemetry-native, privacy-aware monitoring |
| **Redis** | Rate limiting | Optional, for production-grade abuse prevention |
| **Vercel Blob** | File storage | Secure, ephemeral storage for uploaded files |

**Model Selection**: We use Fireworks' Gemma 3.4B-IT (instruction-tuned) model because:
- **Privacy**: Open-source model, no data retention policies like proprietary LLMs
- **Performance**: Fast inference for real-time coaching conversations
- **Cost**: Significantly cheaper than GPT-4 class models
- **Quality**: Surprisingly effective for focused coaching tasks

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (we recommend 20+)
- **pnpm** 9+ (recommended) or npm/yarn
- **PostgreSQL** 14+ (local or hosted)
- **Fireworks AI API Key** ([Get one here](https://fireworks.ai/))

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/privyai/privy-mvp.git
cd privy-mvp

# Install dependencies (we use pnpm)
pnpm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Required: AI Provider
FIREWORKS_API_KEY=fw_your_api_key_here

# Required: Database (local example)
POSTGRES_URL=postgres://localhost:5432/privy

# Required: Auth Secret (generate with command below)
AUTH_SECRET=your_generated_secret_here

# Optional: Observability (Logfire)
LOGFIRE_TOKEN=your_logfire_token
OTEL_EXPORTER_OTLP_ENDPOINT=https://logfire-api.pydantic.dev
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer ${LOGFIRE_TOKEN}

# Optional: File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=vercel_blob_token

# Optional: Rate Limiting (Redis)
REDIS_URL=redis://localhost:6379

# Optional: Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Generate AUTH_SECRET**:
```bash
openssl rand -base64 32
```

### 3. Set Up PostgreSQL

**Option A: Local PostgreSQL**
```bash
# macOS (Homebrew)
brew install postgresql@14
brew services start postgresql@14
createdb privy

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql
sudo systemctl start postgresql
sudo -u postgres createdb privy
```

**Option B: Hosted PostgreSQL**
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Neon](https://neon.tech/) (recommended for free tier)
- [Supabase](https://supabase.com/)
- [Railway](https://railway.app/)

### 4. Initialize Database

```bash
# Push database schema (creates tables)
pnpm db:push

# Or run migrations manually
pnpm db:migrate
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) and start coaching.

---

## Project Structure

```
privy-mvp/
├── app/                      # Next.js 16 App Router
│   ├── (auth)/              # Authentication pages & API routes
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   └── api/auth/        # NextAuth.js API routes
│   └── (chat)/              # Main chat application
│       ├── page.tsx         # Home/chat list page
│       ├── chat/[id]/       # Individual chat page
│       └── api/             # Chat API routes (streaming, history)
│
├── components/              # React components
│   ├── chat.tsx            # Main chat interface
│   ├── suggested-actions.tsx # Coaching mode suggestions
│   └── ui/                 # shadcn/ui components
│
├── lib/                     # Core application logic
│   ├── ai/                 # AI integration
│   │   ├── prompts.ts      # System prompts for coaching modes
│   │   └── models.ts       # AI model configurations
│   ├── db/                 # Database layer
│   │   ├── schema.ts       # Drizzle schema definitions
│   │   ├── queries.ts      # Database queries
│   │   └── migrate.ts      # Migration runner
│   ├── editor/             # Rich text editor utilities
│   └── observability/      # Logfire/OpenTelemetry setup
│
├── hooks/                   # React hooks
├── public/                  # Static assets
└── tests/                   # Test suites
    ├── e2e/                # Playwright end-to-end tests
    └── unit/               # Vitest unit tests
```

---

## Development

### Available Commands

```bash
# Development
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run linter (Ultracite)
pnpm format           # Format code

# Database
pnpm db:generate      # Generate migrations from schema
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema (no migrations)
pnpm db:studio        # Open Drizzle Studio
pnpm db:pull          # Pull schema from database

# Testing
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Generate coverage report
pnpm test:e2e         # Run Playwright E2E tests
```

### Running Tests

**Unit Tests** (Vitest):
```bash
pnpm test
```

**End-to-End Tests** (Playwright):
```bash
# Install browsers (first time only)
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# Run in UI mode (recommended for debugging)
pnpm exec playwright test --ui
```

### Development Workflow

1. **Make changes** to your code
2. **Run tests** to ensure nothing broke
3. **Lint/format** with `pnpm lint` and `pnpm format`
4. **Test locally** with `pnpm dev`
5. **Create PR** with clear description

---

## Deployment

### Deploy to Vercel (Recommended)

**One-Click Deploy**:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/privyai/privy-mvp)

**Manual Deployment**:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

**Environment Variables**:
Add all required environment variables in Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add each variable from `.env.example`
3. Redeploy

**Database Setup**:
```bash
# After deploying, run migrations
vercel env pull .env.local
pnpm db:push
```

### Deploy to Other Platforms

**Railway**:
```bash
# Install Railway CLI
npm i -g railway

# Initialize and deploy
railway init
railway up
```

**Self-Hosted** (Docker):
```bash
# Build Docker image
docker build -t privy-mvp .

# Run container
docker run -p 3000:3000 --env-file .env.local privy-mvp
```

---

## Configuration

### Coaching Mode Customization

Edit `/lib/ai/prompts.ts` to customize coaching behaviors:

```typescript
const COACHING_PROMPTS: Record<CoachingMode, string> = {
  vent: `Your custom prompt here...`,
  decision: `Your custom prompt here...`,
  reframe: `Your custom prompt here...`,
};
```

### AI Model Configuration

Switch AI providers or models in `/lib/ai/models.ts`:

```typescript
// Example: Switch to OpenAI
import { openai } from '@ai-sdk/openai';

export const defaultModel = openai('gpt-4-turbo');
```

### Rate Limiting

Enable Redis-based rate limiting for production:

1. Add `REDIS_URL` to `.env.local`
2. Configure limits in `/app/(chat)/api/chat/route.ts`

---

## Troubleshooting

### Database Connection Issues

**Problem**: `Error: connect ECONNREFUSED`

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Verify connection string format
POSTGRES_URL=postgresql://user:password@host:port/database
```

### Fireworks API Errors

**Problem**: `401 Unauthorized` or `Invalid API key`

**Solution**:
- Verify API key in `.env.local`
- Check API key is active at [fireworks.ai/api-keys](https://fireworks.ai/api-keys)
- Ensure no extra whitespace in environment variable

### Build Errors on Vercel

**Problem**: `Migration failed` or `Table already exists`

**Solution**:
- We skip migrations on Vercel builds (tables created manually)
- Run `pnpm db:push` locally first
- Or use Vercel's CLI to run migrations post-deployment

### Type Errors in AI SDK

**Problem**: Version mismatches between `ai` and `@ai-sdk/*` packages

**Solution**:
```bash
# Update all AI SDK packages together
pnpm update ai @ai-sdk/react @ai-sdk/fireworks
```

---

## Privacy & Security

### Data Handling

**What We Store**:
- Hashed passwords (bcrypt)
- Anonymous chat messages (if user opts in to persistence)
- Session tokens (httpOnly cookies)

**What We DON'T Store**:
- Real names (optional, user-provided only)
- Email addresses (except for premium tier, optional)
- Location data
- IP addresses (not logged)
- Message content in logs

### Security Best Practices

- All database connections use SSL/TLS
- Passwords hashed with bcrypt (10 rounds)
- CSRF protection via Auth.js
- Rate limiting on API routes
- Input sanitization on all user content
- Regular dependency updates via Dependabot

### Compliance

- **GDPR**: Right to deletion, data portability
- **CCPA**: Do-not-sell by default (we don't sell data)
- **SOC 2** (planned): Working towards SOC 2 Type II certification

---

## Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards

- **Linting**: We use Ultracite (Biome) for linting
- **Formatting**: Run `pnpm format` before committing
- **Types**: TypeScript strict mode enabled
- **Tests**: Add tests for new features
- **Commits**: Use conventional commits (e.g., `feat:`, `fix:`, `docs:`)

### What to Contribute

**High Priority**:
- Additional coaching frameworks in Decision Lab mode
- Accessibility improvements (WCAG 2.1 AA)
- Performance optimizations
- Test coverage improvements

**Ideas Welcome**:
- New coaching modes
- Integration with productivity tools
- Mobile app (React Native)
- Voice interface

---

## Roadmap

### Q1 2025
- [ ] Premium tier with Stripe integration
- [ ] Persistent memory across sessions
- [ ] Session analytics dashboard
- [ ] Mobile-responsive improvements

### Q2 2025
- [ ] Voice input/output
- [ ] Multi-language support (Spanish, Mandarin)
- [ ] API for third-party integrations
- [ ] Custom coaching frameworks (user-defined)

### Q3 2025
- [ ] React Native mobile app
- [ ] Team/organizational plans
- [ ] White-label licensing
- [ ] Advanced analytics with privacy guarantees

---

## FAQ

**Q: Is this actually private? How can I trust you?**

A: Privy is open-source—you can audit every line of code. We deliberately designed the system to minimize data collection. For maximum privacy, use guest mode with burn-after-session enabled. We encourage self-hosting for the most paranoid users.

**Q: Why not use ChatGPT or Claude directly?**

A: General-purpose AI assistants aren't optimized for leadership coaching. They lack specialized frameworks, can be judgmental, and their training optimizes for helpfulness over the unique needs of stressed executives. Plus, OpenAI/Anthropic retain your conversations for training.

**Q: What's the difference between Privy and therapy?**

A: Privy is performance coaching, not therapy. We help leaders think clearly, make better decisions, and manage stress—but we don't diagnose or treat mental health conditions. If you need therapy, please seek a licensed professional.

**Q: Can I self-host Privy?**

A: Yes! Privy is MIT licensed. Clone the repo, set up your own database and API keys, and you have complete control. See the [Self-Hosted](#deploy-to-other-platforms) section.

**Q: How do you make money if it's free and private?**

A: We plan to offer a premium tier with additional features (persistent memory, unlimited messages, advanced frameworks). The free tier will always exist. We'll never sell user data.

**Q: What happens to my data if I delete my account?**

A: Hard deletion within 24 hours. We don't keep backups of deleted user data (except encrypted database backups that cycle out after 30 days). Guest sessions can be burned immediately.

**Q: Can I export my chat history?**

A: Yes, click the "Export" button in any chat to download as JSON or Markdown. Your data, your control.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

**TL;DR**: You can do whatever you want with this code. Build on it, monetize it, fork it. Just keep the license notice.

---

## Acknowledgments

- **shadcn**: For the beautiful, accessible UI components
- **Fireworks AI**: For fast, privacy-focused inference
- **Open Source Community**: For the foundation we build on

---

## Support

- **Documentation**: [Coming soon]
- **Issues**: [GitHub Issues](https://github.com/privyai/privy-mvp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/privyai/privy-mvp/discussions)
- **Email**: hello@privy.ai (for urgent security issues)

---

**Built with by founders, for founders.**

**Because leaders deserve a safe place to think.**
