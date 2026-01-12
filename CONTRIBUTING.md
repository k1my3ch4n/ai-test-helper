# Contributing to AI Test Helper

Thank you for your interest in contributing to AI Test Helper!

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ai-test-helper.git
   cd ai-test-helper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run linting:
   ```bash
   npm run lint
   ```

## Project Structure

```
ai-test-helper/
├── src/
│   ├── index.ts          # Main entry point
│   ├── api/              # AI API clients (Claude, Gemini)
│   ├── git/              # Git analysis module
│   └── generator/        # Test generation module
├── dist/                 # Compiled output (bundled with ncc)
├── action.yml            # GitHub Action definition
└── package.json
```

## Building

```bash
# TypeScript compilation only
npm run build

# Full build with ncc bundling (required for GitHub Actions)
npm run package
```

## Code Style

- We use ESLint and Prettier for code formatting
- Run `npm run lint:fix` to auto-fix issues
- Run `npm run format` to format code

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Adding New AI Providers

To add support for a new AI provider:

1. Create a new file in `src/api/` (e.g., `newprovider.ts`)
2. Implement the `AIClient` interface
3. Add the provider to `src/api/index.ts`
4. Update the `AIProvider` type in `src/api/types.ts`
5. Update documentation and action.yml

## Reporting Issues

Please use GitHub Issues to report bugs or suggest features.
