# Claude Code Instructions for Privy MVP

## Critical Rules

### DO NOT RESTORE FILES
- **NEVER** use `git restore` on any files unless explicitly instructed by the user
- **NEVER** assume changes are unrelated and restore them
- When reviewing changes with `git status` or `git diff`, commit ALL changes as-is
- If unsure about a change, ASK the user - don't restore it
- The user knows what changes they want - trust their working directory

### Committing Changes
- Stage and commit all modified files shown in `git status`
- Do not cherry-pick which changes to include unless user explicitly says to
- If you see unexpected changes, ask about them - don't remove them

### Example of What NOT to Do
```bash
# ❌ WRONG - Don't do this
git restore components/message.tsx  # Never restore files!

# ✅ CORRECT - Do this instead
git add components/message.tsx      # Add the file as-is
# Or ask: "I see message.tsx changed. Should I include it in the commit?"
```

## Project-Specific Context

- This is Privy, a privacy-focused AI mental performance coach
- Zero-trust token authentication system
- EU/Switzerland data residency
- Uses shadcn/ui components + Tailwind CSS
- Next.js app with TypeScript
