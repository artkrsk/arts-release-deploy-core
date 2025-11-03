# @arts/release-deploy-core

Shared core utilities for Release Deploy for EDD plugins (Lite and Pro versions).

## Contents

- **types/** - TypeScript type definitions
- **interfaces/** - TypeScript interfaces
- **constants/** - Shared constants (API actions, UI intervals, protocols)
- **utils/** - Pure utility functions (formatting, parsing)
- **hooks/** - Reusable React hooks
- **services/** - Service layer (GitHub API client)

## Usage

```typescript
import {
  formatSize,
  usePolling,
  GitHubService,
  API_ACTIONS,
  type TGitHubRepo,
  type IGitHubRelease
} from '@arts/release-deploy-core';
```

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Development

This package is shared between Release Deploy for EDD Lite and Pro versions using pnpm workspaces.
