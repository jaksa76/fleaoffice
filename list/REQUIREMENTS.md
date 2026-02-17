# List Requirements

## Overview

A card-based data manager — like a spreadsheet but built around items instead of cells. Each list is a collection of cards that share a schema. Users define fields on the schema, and every card in the list has those fields. Good for inventories, contacts, recipes, media libraries, budgets, or anything structured.

## Collections

- Users create named collections (e.g. "Book Library", "Monthly Budget")
- Each collection has its own schema (set of fields)
- Collections are listed on a home screen with card count and last-modified date
- Create, rename, delete collections

## Schema and Fields

Each field has a name, type, and optional config. Field types:

| Type | Notes |
|------|-------|
| `name` | Single primary text field per schema; displayed as card title |
| `text` | Plain text, single or multi-line |
| `number` | Integer or decimal |
| `currency` | Number with currency symbol |
| `date` | Date (no time) |
| `checkbox` | Boolean |
| `select` | Single value from a predefined list |
| `multi-select` | Multiple values from a predefined list |
| `picture` | Image upload; displayed prominently on the card |
| `url` | Clickable link |
| `formula` | Computed value (see Formulas) |

- Fields can be reordered and hidden per view
- Deleting a field removes it from all cards (with confirmation)

## Cards

- Each card is an instance of the collection's schema
- Card view shows all fields; the `name` field is the title, `picture` (if present) appears at the top
- Create, edit, delete cards
- Inline editing directly on the card

## Field Types
- `name`: required, single per schema, used as card title
- `text`: single or multi-line text
- `number`: integer or decimal
- `currency`: number with currency symbol
- `date`: date only (no time)
- `checkbox`: boolean value
- `select`: single value from a predefined list
- `multi-select`: multiple values from a predefined list
- `picture`: image upload, displayed prominently on the card
- `gallery`: multiple images, displayed in a carousel on the card
- `url`: clickable link
- `formula`: computed value based on other fields (see Formulas)

## Formulas

- Formula fields compute a value from other fields on the same card
- Syntax: simple expression language referencing other fields by name (e.g. `{price} * {quantity}`)
- Supported operations: arithmetic (`+ - * /`), comparisons, basic functions (`round()`, `if()`, `concat()`, `today()`, `datediff()`)
- Formula fields are read-only on the card
- Circular references are detected and shown as an error

## Views

Mobile: - List view: vertical list of cards, showing key fields
Desktop: - Grid view: cards arranged in a grid, showing key fields

Details view: focused view of a single card with all fields

## Filtering and Sorting

- Filter cards by any field value (equality, range, contains, is empty)
- Multiple filters combined with AND/OR
- Sort by any field, ascending or descending
- Filters and sorts are saved with the view
- Select which fields are visible

## Aggregates

- Per-field aggregate shown at the bottom of the as a summary card in grid/gallery
- Supported aggregates: count, sum, average, min, max, count-checked (for checkbox)
- User selects which aggregate to show per field

## Charts

- Charts are attached to a collection and can be added alongside any view
- Chart types: bar, line, pie, scatter
- X and Y axes mapped to fields (numeric or date for axes; any for grouping)
- Multiple charts per collection; each chart is named and saved
- Charts update live as card data changes

## Data Storage

- All data stored via Fleabox API at `/api/list/data/`
- Each collection stored as a directory: `<collection-slug>/`
  - `schema.json` — field definitions and view configs
  - `items.json` — array of card objects
  - 'images/' — directory for uploaded pictures, with filenames referenced in `items.json`

## UI

- Mobile-first, responsive layout
- Consistent with the rest of the Fleaoffice suite (minimal, clean)
- Quick-add card from the collection header
