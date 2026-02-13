# Write

A simple markdown document editor for Fleabox.

## Project Structure

```
write/
├── src/               # Source files
│   ├── index.html    # Main documents list page
│   ├── editor.html   # Document editor page
│   ├── app.js        # Main application logic
│   ├── editor.js     # Editor initialization
│   └── style.css     # Styles
├── tests/            # Playwright tests
├── dist/             # Build output (gitignored)
│   └── write/        # Fleabox app structure
└── package.json
```

## Development

### Setup
```bash
npm install
```

### Build
Copies source files to `dist/write/` for Fleabox:
```bash
npm run build
```

### Development Server
Builds and starts Fleabox in development mode:
```bash
npm run dev
```

The app will be available at: `http://localhost:3000/write/`

### Testing
Run all tests (automatically builds first):
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests in debug mode:
```bash
npm run test:debug
```

Run tests with visible browser:
```bash
npm run test:headed
```

### Clean
Remove all build artifacts and test results:
```bash
npm run clean
```

## Features

- Markdown editor using Milkdown
- Document list with previews
- Auto-save functionality
- Image upload support
- Data stored via Fleabox API

## Technology

- **Editor**: Milkdown (Markdown WYSIWYG editor)
- **Storage**: Fleabox API (JSON file storage)
- **Testing**: Playwright
