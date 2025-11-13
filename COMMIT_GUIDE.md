# Git Commit Guidelines

## Commit Message Format

All commit messages should follow conventional commits format:

```
<type>: <subject>

<body> (optional)
```

### Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `chore:` - Build process or auxiliary tool changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `ci:` - CI/CD changes

### Examples:

```bash
feat: add ERC-20 token support to escrow
fix: resolve TypeScript typing issues in tests
docs: update README with V3 features
test: add comprehensive escrow tests
chore: upgrade to SafeBaseV3 on base mainnet
ci: add upgrade-v3 workflow
```

## Important Notes

1. **Auto-commits in Emergent**: Commits made through Emergent UI are auto-generated
2. **Manual commits**: When manually committing, use descriptive English messages
3. **GitHub Actions**: Workflow commits use `github-actions[bot]` user
4. **Deployment commits**: Use format `chore: upgrade to v3 on [network]`

## Git Configuration

Set your identity:
```bash
git config user.name "natalya-bbr"
git config user.email "natalya-bbr@users.noreply.github.com"
```
