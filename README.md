**Mission**:
Provide a modern, web based, mobile first suite of personal productivity tools through a beautiful UI, requiring only a few MB of RAM to run on your server.

**Vision**:
To grow into a fully reimagined office suite liberating users from legacy concepts and feature bloat. To be the go-to solution for users who want a simple, efficient, and delightful productivity experience without the need for expensive hardware or software.

## Fleaoffice Suite
**write** - an elegant markdown editor
**list** - make lists of items instead of tables
**agenda** - meetings and tasks living together
**show** - a modern way to create presentations

## Design

See [UI Guidelines](docs/UI-GUIDELINES.md) for design principles and patterns used across all Fleaoffice apps.

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

