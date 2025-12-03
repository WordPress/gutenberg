# Block Visibility Breakpoints - Extensibility Considerations

## Overview

The current implementation uses hardcoded breakpoint values and semantic names (mobile, tablet, desktop). To support user-defined breakpoints from theme.json, the following areas need to be made extensible:

## Current Implementation Limitations

### 1. Hardcoded Breakpoint Values

**JavaScript (`use-block-props/index.js`):**
- Uses hardcoded breakpoint names: `'small'` (600px) and `'large'` (960px)
- Semantic mapping: mobile (< 600px), tablet (600-960px), desktop (>= 960px)

**PHP (`block-visibility-breakpoints.php`):**
- Hardcoded pixel values in CSS: `599px`, `600px`, `959px`, `960px`
- Media queries are static and don't adapt to theme.json settings

### 2. Fixed Data Structure

**Metadata structure:**
```javascript
blockVisibilityBreakpoints: {
  mobile: boolean,
  tablet: boolean,
  desktop: boolean
}
```

This structure assumes exactly three semantic breakpoint ranges and doesn't support arbitrary breakpoint names.

### 3. Hardcoded UI Labels

**Modal component:**
- Fixed labels: "Hide on mobile", "Hide on tablet", "Hide on desktop"
- UI doesn't adapt to available breakpoints from theme.json

## Extensibility Requirements

### 1. Breakpoint Configuration Source

**Recommended approach:**
- Use `useSettings()` hook to access breakpoint definitions from theme.json
- Breakpoints should be available at: `settings.layout.breakpoints` or similar
- Fall back to default breakpoints if not defined in theme.json

**Example theme.json structure:**
```json
{
  "settings": {
    "layout": {
      "breakpoints": {
        "mobile": { "max": 599 },
        "tablet": { "min": 600, "max": 959 },
        "desktop": { "min": 960 }
      }
    }
  }
}
```

### 2. Dynamic Breakpoint Mapping

**JavaScript:**
- Replace hardcoded `'small'` and `'large'` with breakpoint names from settings
- Map semantic names (mobile/tablet/desktop) to actual breakpoint definitions
- Support arbitrary breakpoint names, not just the three semantic ones

**Example:**
```javascript
// Get breakpoints from settings
const breakpoints = useSettings('layout.breakpoints');
// Use breakpoint names dynamically
const isMobileViewport = useViewportMatch(breakpoints.mobile.maxBreakpoint, '<');
```

### 3. Flexible Data Structure

**Option A: Keep semantic names, map to breakpoints**
```javascript
blockVisibilityBreakpoints: {
  mobile: boolean,    // Maps to breakpoints.mobile
  tablet: boolean,    // Maps to breakpoints.tablet
  desktop: boolean   // Maps to breakpoints.desktop
}
```

**Option B: Use breakpoint names directly**
```javascript
blockVisibilityBreakpoints: {
  'small': boolean,   // Direct breakpoint name
  'large': boolean,   // Direct breakpoint name
  'medium': boolean   // Any breakpoint from theme.json
}
```

**Recommendation:** Option A maintains backward compatibility while allowing breakpoint values to change. Option B is more flexible but requires migration.

### 4. Dynamic CSS Generation

**PHP:**
- Generate CSS media queries from breakpoint definitions
- Access breakpoint values from `wp_get_global_settings()` or theme.json
- Support both min/max and single-value breakpoint definitions

**Example:**
```php
$breakpoints = wp_get_global_settings()['layout']['breakpoints'] ?? [];
// Generate CSS dynamically based on breakpoint definitions
foreach ($breakpoints as $name => $breakpoint) {
    // Build media query from breakpoint definition
    $media_query = build_media_query($breakpoint);
    $css .= "@media {$media_query} { .wp-block-hidden-{$name} { display: none !important; } }";
}
```

### 5. Dynamic UI Generation

**Modal component:**
- Generate checkboxes dynamically from available breakpoints
- Use breakpoint labels from theme.json if available
- Fall back to breakpoint names if labels not provided

**Example:**
```javascript
const breakpoints = useSettings('layout.breakpoints');
const breakpointConfig = useSettings('layout.breakpointLabels') || {};

return breakpoints.map((name, config) => (
  <CheckboxControl
    label={breakpointConfig[name]?.label || `Hide on ${name}`}
    checked={breakpoints[name]}
    onChange={(value) => setBreakpoint(name, value)}
  />
));
```

## Implementation Strategy

### Phase 1: Make Breakpoint Values Configurable (Current MVP)
- Keep semantic names (mobile/tablet/desktop)
- Read breakpoint values from settings instead of hardcoding
- Generate CSS from settings

### Phase 2: Support Custom Breakpoint Names
- Allow theme.json to define custom breakpoint names
- Map semantic names to custom breakpoint definitions
- Update UI to show custom breakpoint labels

### Phase 3: Full Extensibility
- Support arbitrary number of breakpoints
- Dynamic UI generation
- Flexible data structure supporting any breakpoint configuration

## Key Files to Modify for Extensibility

1. **`packages/block-editor/src/components/block-list/use-block-props/index.js`**
   - Replace hardcoded breakpoint names with values from `useSettings()`
   - Map semantic names to actual breakpoint definitions

2. **`packages/block-editor/src/components/block-visibility-breakpoints/modal.js`**
   - Generate checkboxes dynamically from breakpoint settings
   - Use breakpoint labels from theme.json

3. **`lib/block-supports/block-visibility-breakpoints.php`**
   - Generate CSS from breakpoint definitions via `wp_get_global_settings()`
   - Support dynamic media query generation

4. **`packages/block-editor/src/hooks/block-visibility-breakpoints.js`**
   - Generate class names dynamically based on available breakpoints
   - Support arbitrary breakpoint names in class generation

## Backward Compatibility

- Maintain support for current `{ mobile, tablet, desktop }` structure
- Default breakpoint values should match current hardcoded values
- Migration path for existing content when breakpoints change

## Testing Considerations

- Test with default breakpoints (current behavior)
- Test with custom breakpoint values in theme.json
- Test with custom breakpoint names
- Test with missing breakpoint definitions (fallback behavior)
- Test CSS generation with various breakpoint configurations

