# PostPicker Component Implementation

## Overview
The `PostPickerModal` is a generalized component that allows selecting a post (typically a page) from a modal dialog. It's accessed via the `postPickerKey` private symbol injected into block editor settings, similar to how `mediaUpload` is injected.

This component is used primarily for selecting parent pages from the parent field in the `packages/fields` package, but is designed to be flexible enough to work with any hierarchical post type.

## Architecture

### Core Components

#### 1. PostPickerModal Component (`index.tsx`)
- **Main component** that renders a Modal with DataViewsPicker
- Uses `@wordpress/dataviews` for the browsing/selection interface
- Fetches posts via `@wordpress/core-data` using `useEntityRecordsWithPermissions`
- Displays a flat list of posts with title, status, and date columns
- Supports search across all fields
- Single-selection only (modal stays open after selection)

**Key Features:**
- Flat list display (no hierarchy visualization)
- Full search support
- Pagination support
- Excludes current post ID from results
- TODO: Add parent_exclude logic for preventing circular hierarchies

#### 2. Type Definitions (`types.ts`)
```typescript
interface PostPickerModalProps {
  isOpen: boolean;                    // Controls modal visibility
  onClose: () => void;                // Called when modal closes
  onSelect: (postId: number) => void; // Called with selected post ID
  postType: string;                   // e.g., 'page', 'post'
  excludePostId?: number;             // Current post to exclude
  title?: string;                     // Custom modal title
}

interface PostData {
  id: number;
  title: { raw?: string; rendered?: string };
  status: 'publish' | 'draft' | ...;
  // ... other post fields
}
```

### Symbol Injection Flow

```
packages/block-editor/src/store/private-keys.ts
  ↓ (exports postPickerKey symbol)
packages/block-editor/src/private-apis.js
  ↓ (locks symbol in private APIs)
packages/editor/src/components/provider/use-block-editor-settings.js
  ↓ (unlocks symbol and injects PostPickerModal wrapper)
Block Editor Settings
  ↓ (symbol becomes accessible via settings[postPickerKey])
packages/fields/src/fields/parent/parent-edit.tsx
  ↓ (accesses and uses PostPickerModal)
User can select parent post
```

### Integration with Block Editor Settings

The `PostPickerModal` component is injected into block editor settings as a wrapped component that:
1. Manages modal open/close state
2. Wraps post selection callback to update the parent field
3. Is accessed via the `postPickerKey` symbol

Usage pattern in parent field:
```typescript
const postPickerModal = blockEditorSettings[postPickerKey];
// Returns a React component that can be rendered
```

## Design Decisions

### 1. **Flat List Display**
- No hierarchy visualization (indentation/breadcrumbs)
- Simpler implementation
- Consistent with Media modal pattern
- Users can search to find specific pages

### 2. **Modal Stays Open After Selection**
- Allows users to adjust their selection without reopening
- Users click X button or outside to close
- Single-selection only (no multi-select)

### 3. **Post Exclusion**
- Excludes `excludePostId` from results
- TODO: Implement `parent_exclude` to prevent selecting descendants
- Prevents selecting current post as own parent

### 4. **Search**
- Full search across all post fields
- Uses WordPress REST API search parameter
- Case-insensitive

### 5. **Single Selection**
- Only single post selection (not multiple)
- Returns single `number` (post ID), not array

## File Structure

```
packages/editor/src/components/post-picker-modal/
├── index.tsx              # Main component
├── types.ts               # TypeScript type definitions
└── IMPLEMENTATION.md      # This file
```

## Related Files

**Block Editor Setup:**
- `packages/block-editor/src/store/private-keys.ts` - Symbol definition
- `packages/block-editor/src/private-apis.js` - Symbol export
- `packages/editor/src/components/provider/use-block-editor-settings.js` - Symbol injection

**Field Integration:**
- `packages/fields/src/fields/parent/parent-edit.tsx` - Usage in parent field

## Future Enhancements

1. **Parent Exclusion**: Add `parent_exclude` query parameter to prevent circular hierarchies
   - Requires querying descendants of `excludePostId` first
   - Can be added as a TODO for future work

2. **Custom Columns**: Make field columns configurable per use case

3. **Default Layout**: Support configurable default layout (grid vs table)

4. **Multi-Select**: Extend to support multiple selection if needed

## Implementation Notes

- Uses `useEntityRecordsWithPermissions` hook for efficient data fetching
- Respects WordPress user permissions for post types
- Defaults to showing published posts only
- Results ordered by title ascending for consistency
