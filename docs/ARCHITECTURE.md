# Fleaoffice Architecture

## Overview

Fleaoffice is a modern, web-based personal productivity suite designed to run on [Fleabox](https://github.com/nicholasgasior/fleabox), a lightweight self-hosted application hub. The suite consists of four applications that share a common technical foundation while remaining independently deployable.

### Design Philosophy

- **Minimal Resource Footprint**: Requires only a few MB of RAM to run
- **Mobile-First**: Beautiful, responsive UI designed for mobile and desktop
- **Self-Hosted**: User data stays on your server, stored as simple files
- **Modern Yet Simple**: Clean architecture without feature bloat or legacy baggage

### Suite Components

| App | Status | Purpose |
|-----|--------|---------|
| **write** | ✅ Implemented | Elegant markdown document editor |
| **agenda** | 🚧 Placeholder | Meeting and task management |
| **list** | 🚧 Placeholder | Item-based list management |
| **show** | 🚧 Placeholder | Modern presentation creation |

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Fleabox** | 2.0.4 | Generic backend |
| **React** | 19.2.0 | UI framework - latest with concurrent features |
| **TypeScript** | 5.9.3 | Type-safe development with strict mode |
| **Vite** | 7.3.1 | Fast build tool and dev server |
| **React Router** | 7.1.3 | Client-side routing (write app) |

### Build & Development

| Tool | Purpose |
|------|---------|
| **ESLint** | Code quality and style enforcement |
| **Playwright** | End-to-end testing framework |

## Architectural Patterns


### 1. Integration with Fleabox

Fleabox is the hosting platform that:
- Serves static files from `/srv/fleabox/<app-id>/`
- Provides a REST API for data operations
- Handles authentication via cookie-based tokens
- Stores user data in `~/.local/share/fleabox/<app-id>/data/`

**API Contract:**
- `GET /api/<app-id>/data/<path>` - Read file or list directory
- `PUT /api/<app-id>/data/<path>` - Write file (auto-creates parent dirs)
- `DELETE /api/<app-id>/data/<path>` - Delete file or directory

**Key Integration Points:**
1. **Base Path Configuration**: Each app uses `base: '/<app-name>/'` in Vite config
2. **Authentication**: Automatic via cookies (transparent to apps)
3. **Data Storage**: Apps use simple REST calls, Fleabox handles persistence

### 2. Data Flow

```
User Action → Component State → useStorage Hook → Fleabox API
                                       ↓
                                  Local Cache
                                       ↓
                              Filesystem Storage
```

**Example: Saving a Document**
1. User types in Milkdown editor
2. `onContentChange` callback updates component state
3. `useAutoSave` debounces for 2 seconds
4. `storage.saveFile()` makes PUT request to `/api/write/data/doc.md`
5. Fleabox writes to `~/.local/share/fleabox/write/data/doc.md`
6. Response confirms success, UI shows "Saved" status

## Technical Decisions & Rationale

### Why React?

- **Coding Agent Familiarity**: Well-known patterns and best practices
- **Mature Ecosystem**: Extensive library support

### Why Vite?

- **Speed**: Fast cold starts and hot module replacement
- **ESM Native**: Modern module system, no legacy bundler overhead
- **TypeScript Support**: First-class TypeScript integration
- **Dev Experience**: Excellent DX with instant updates

### Why TypeScript with Strict Mode?

- **Type Safety**: Catch errors at compile time
- **Better Refactoring**: Rename, move, and change with confidence
- **LSP Support**: Agents can use LSP servers for code analysis and generation

### Why Monorepo?

- **Setting Examples**: Agent can pick up patterns across apps
- **Shared Tooling**: Consistent build and linting configuration
- **Independent Deployments**: Each app can be built and deployed separately

### Why Playwright for Testing?

- **Cross-Browser**: Test in Chromium, Firefox, and WebKit
- **Modern API**: Async/await based, clean and readable
- **Auto-Wait**: Handles timing issues automatically
- **Network Control**: Mock and intercept API calls
- **E2E Focus**: Tests real user scenarios, not implementation details

### Why File-Based Storage?

- **Simplicity**: No database setup or migrations
- **Transparency**: Users can inspect/backup their data easily
- **Unix Philosophy**: Text files and directories, scriptable
- **Low Overhead**: Minimal memory footprint
- **Version Control**: User data can be git-tracked if desired
- **Agents Can Manipulate**: Easy for coding agents to read/write files directly if needed

### Testing Strategy

**Testing Approach:**
- End-to-end tests simulate real user workflows
- Tests use Playwright's request API to set up/teardown test data
- Fleabox dev server starts automatically via Playwright config
- Tests run sequentially (workers: 1) to avoid data conflicts

### Code Quality

**Code Structure:**
- Clear separation of concerns by feature rather than technical layers
- Favour decoupling over reuse; shared code only when it provides significant value

**Linting:**
- ESLint with TypeScript plugin
- React Hooks rules enforced
- React Refresh plugin for HMR
- Runs independently per app: `npm run lint`

**Type Checking:**
- Strict TypeScript mode enabled
- No implicit any, unused variables, or unreachable code
- Project references for incremental builds: `tsc -b`
