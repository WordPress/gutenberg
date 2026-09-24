# Inserter

The `Inserter` component provides a user interface for inserting blocks, patterns, and media into the block editor. It includes search functionality, categorized tabs, and preview capabilities.

## Component Structure

The Inserter consists of several key parts:
- Block Types Tab: For inserting standard blocks
- Patterns Tab: For inserting block patterns
- Media Tab: For inserting media content
- Search functionality across all content types
- Preview panel for blocks and patterns

![Inserter Interface](path-to-inserter-screenshot.png)

## Development guidelines

### Usage

```jsx
import { Inserter } from '@wordpress/block-editor';

const MyInserter = () => (
    <Inserter
        rootClientId="unique-id"
        onSelect={( blocks ) => {
            // Handle block insertion
        }}
        showInserterHelpPanel
    />
);
```

### Props

#### `rootClientId`
- **Type:** `String`
- **Default:** `undefined`
- **Description:** The client ID of the block where new blocks will be inserted

#### `onSelect`
- **Type:** `Function`
- **Description:** Callback invoked when a block or pattern is selected for insertion

#### `showInserterHelpPanel`
- **Type:** `Boolean`
- **Default:** `false`
- **Description:** Whether to show the help panel with block/pattern previews

#### `__experimentalInsertionIndex`
- **Type:** `Number`
- **Description:** Specific position where blocks should be inserted

#### `isAppender`
- **Type:** `Boolean`
- **Default:** `false`
- **Description:** Whether the inserter is being used as an appender

### Structure

```jsx
<Inserter
    rootClientId={rootClientId}
    onSelect={onSelect}
    showInserterHelpPanel={true}
    __experimentalInsertionIndex={2}
    isAppender={false}
>
    {/* Inserter content */}
</Inserter>
```

## Tabs

### Blocks Tab
Displays available blocks organized by category. Includes:
- Most used blocks section
- Block categories
- Search functionality
- Block preview on hover

### Patterns Tab
Shows available block patterns with:
- Pattern categories
- Pattern previews
- Sync status filtering
- Search functionality

### Media Tab
Provides access to media insertion with:
- Media categories
- Media preview
- Upload capabilities
- External media options

## Related Components

Block Editor components are components that can be used to compose the UI of your block editor. They should be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
