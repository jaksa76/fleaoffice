Fleaoffice is a modern, web based, mobile first suite of personal productivity tools through a beautiful UI, requiring only a few MB of RAM to run on your server.

## Fleaoffice Suite
**write** - an elegant markdown editor
**list** - make lists of items instead of tables
**agenda** - meetings and tasks living together
**show** - a modern way to create presentations

## Design

See [UI Guidelines](docs/UI-GUIDELINES.md) for design principles and patterns used across all Fleaoffice apps.

### 1. Monorepo Structure

```
fleaoffice/
├── write/           # Markdown editor (fully implemented)
├── agenda/          # Meeting & task manager (placeholder)
├── list/            # List manager (placeholder)
├── show/            # Presentation tool (placeholder)
├── docs/            # Architecture and technical documentation
├── dist/            # Build output (all apps)
└── package.json     # Root build orchestration
```

Each app is:
- **Independently buildable**: `cd write && npm run build`
- **Self-contained**: Own dependencies, config, and tests
- **Consistently configured**: Shared build patterns and tooling

### 2. Build System

The build system uses a two-phase approach:

**Phase 1: Per-App Build**
```bash
tsc -b              # TypeScript compilation
vite build          # Bundle with Vite
```

**Phase 2: Root Aggregation**
```bash
npm run build       # Builds all 4 apps sequentially
npm run copy        # Copies to root dist/ directory
```

**Output Structure:**
```
dist/
├── write/
├── agenda/
├── list/
└── show/
```

## Development

### Quick Start

```bash
# Build all apps and start Fleabox
npm run fleabox
```

### Building

```bash
# Build all apps
npm run build

# Build individual app
cd write && npm run build
```

### Testing

```bash
# Run tests (currently only write has tests)
npm test
```

### Cleaning

```bash
# Clean all build artifacts
npm run clean
```

### Development Workflow

Each app can still be developed independently:
```bash
cd write
npm run fleabox  # Build and run just this app
```

Or run all apps together from the root:
```bash
npm run fleabox  # Builds all apps
```

