# Breakpoints

Device-related viewport breakpoints for WordPress. All values are in pixels.

## Available Breakpoints

- **zoomed-in** (280px) - Extreme zoom accessibility
- **mobile** (480px) - Mobile devices
- **small** (600px) - Small tablets / large phones
- **medium** (782px) - Adminbar expands
- **large** (960px) - Admin sidebar auto-folds
- **xlarge** (1080px) - Desktop
- **wide** (1280px) - Wide desktop
- **huge** (1440px) - Large desktop
- **xhuge** (1920px) - Extra large desktop

## Usage

### SCSS
```scss
@use "@wordpress/base-styles/breakpoints";
@use "@wordpress/base-styles/mixins";

.my-component {
  @include mixins.break-medium() {
    // Styles for medium+ screens
  }
}

// Or use variables directly
@media (min-width: #{breakpoints.$break-medium}) {
  // Styles
}
```

### JavaScript
```js
import { BREAKPOINTS } from '@wordpress/base-styles';

// Access raw breakpoint values
console.log( BREAKPOINTS.medium ); // 782
console.log( BREAKPOINTS.small );  // 600
```

## Source of Truth

All breakpoints are defined in `breakpoints.json`. The build script generates:
- `_breakpoints.scss` - SCSS variables
- `breakpoints.ts` - TypeScript module

The TypeScript build system compiles .ts files and generates type definitions automatically.

Run `npm run build` in this package to regenerate after editing `breakpoints.json`.

## Historical Context

WordPress uses many media query values. Starred values are most common:
- 600px *, 640px *, 782px *, 960px *, 400px *, 480px *, 320px *

Try to use existing breakpoints rather than adding new ones to avoid fragmentation.
