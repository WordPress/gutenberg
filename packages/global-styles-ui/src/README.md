# Global Styles UI

React component for editing global styles with a familiar interface inspired by WordPress Gutenberg.

## Public API

### GlobalStylesUI

The main component for rendering a global styles editing interface.

```typescript
import { GlobalStylesUI } from '@wordpress/global-styles-ui';

<GlobalStylesUI
  value={userGlobalStyles}
  inheritedValue={mergedGlobalStyles}
  onChange={setGlobalStyles}
  path="/colors"
  onPathChange={setPath}
  onReset={() => resetStyles()}
  onExportCSS={() => exportCSS()}
  fontLibraryEnabled={true}
  serverCSS={serverCSS}
  serverSettings={serverSettings}
/>
```

#### Props

-   **`value`** (`GlobalStylesConfig`): The user global styles object (what gets edited)
-   **`inheritedValue`** (`GlobalStylesConfig`): The merged global styles object (base + user, for display/inheritance)
-   **`onChange`** (`(newValue: GlobalStylesConfig) => void`): Callback when styles change
-   **`path`** (`string`, optional): Current navigation path (e.g., "/colors", "/typography")
-   **`onPathChange`** (`(newPath: string) => void`, optional): Callback when navigation changes
-   **`onReset`** (`() => void`, optional): Callback for reset action
-   **`onExportCSS`** (`() => void`, optional): Callback for CSS export action
-   **`fontLibraryEnabled`** (`boolean`, optional): Whether font library is enabled (default: false)
-   **`serverCSS`** (`{ isGlobalStyles?: boolean }[]`, optional): Server CSS styles for BlockEditorProvider
-   **`serverSettings`** (`{ __unstableResolvedAssets: Record<string, unknown> }`, optional): Server settings for BlockEditorProvider

## Dependencies

This component has the following external dependencies:

### WordPress Dependencies

-   **`@wordpress/core-data`** - Used internally for fetching:

    -   Style variations (`useEntityRecords('root', 'globalStyles')`)
    -   Font collections and families (`useEntityRecords('postType', 'wp_font_family')`)
    -   User capabilities (`useSelect(select => select('core').canUser(...))`)

-   **`@wordpress/components`** - UI components (Navigator, Button, Panel, etc.)
-   **`@wordpress/blocks`** - Block type information and supports
-   **`@wordpress/element`** - React utilities
-   **`@wordpress/i18n`** - Internationalization

### Internal Dependencies

-   **`../global-styles-engine`** - Generic global styles utilities (framework-agnostic)

## Architecture

### Internal Structure

The component is internally generic and framework-agnostic, with WordPress dependencies only used for:

1. **Data Fetching**: Font collections, style variations, and user capabilities
2. **UI Components**: WordPress design system components
3. **Block Information**: Block type support detection

### Data Flow

1. Parent provides `value` (global styles) and `onChange` callback
2. Component uses WordPress stores for additional data (fonts, variations, capabilities)
3. Internal context manages state and provides hooks to child components
4. Changes flow back through `onChange` callback

## Usage Example

```typescript
function MyStylesPage() {
  const [globalStyles, setGlobalStyles] = useState(initialStyles);
  const [currentPath, setCurrentPath] = useState('/');

  return (
    <GlobalStylesUI
      value={globalStyles}
      onChange={setGlobalStyles}
      path={currentPath}
      onPathChange={setCurrentPath}
      onReset={() => setGlobalStyles(defaultStyles)}
      onExportCSS={() => downloadCSS(globalStyles)}
    />
  );
}
```

This component provides a complete global styles editing experience while maintaining a clean, controlled API.
