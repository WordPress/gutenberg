# Breakpoints

Device-related viewport breakpoints for WordPress. All values are in pixels.

## Available Breakpoints

| Slug | Value | Description | Used for |
|------|------|-------------|-------|
| `zoomed-in` | 280px | Extreme zoom accessibility | - |
| `mobile` | 480px | Mobile devices | - |
| `small` | 600px | Small tablets / large phones | - |
| `medium` | 782px | Max value for mobile | Adminbar expands |
| `large` | 960px | Small desktop | Admin sidebar auto-folds |
| `xlarge` | 1080px | Desktop | - |
| `wide` | 1280px | Wide desktop | - |
| `huge` | 1440px | Large desktop | - |
| `xhuge` | 1920px | Extra large desktop | - |

## Usage

### SCSS
```scss
@use "@wordpress/base-styles/breakpoints";
@use "@wordpress/base-styles/mixins";

.my-component {
  @include mixins.break-medium() {
    Styles for medium+ screens
  }
}

Or use variables directly
@media (min-width: #{breakpoints.$break-medium}) {
  Styles
}
```

### JavaScript
```js
import { BREAKPOINTS } from '@wordpress/base-styles';

Access raw breakpoint values
console.log( BREAKPOINTS.medium ); 782
console.log( BREAKPOINTS.small );  600
```

## Source of Truth

All breakpoints are defined in `src/breakpoints.ts`. The build script generates:
- `_breakpoints.scss` - SCSS variables

The TypeScript build system compiles .ts files and generates type definitions automatically.

Run `npm run build` in this package to regenerate SCSS after editing `src/breakpoints.ts`.

## Historical Context

All media queries currently in WordPress:

```css
min-width: 2000px
min-width: 1680px
min-width: 1250px
max-width: 1120px *
max-width: 1000px
min-width: 769px and max-width: 1000px
max-width: 960px *
max-width: 900px
max-width: 850px
min-width: 800px and max-width: 1499px
max-width: 800px
max-width: 799px
max-width: 782px *
max-width: 768px
max-width: 640px *
max-width: 600px *
max-width: 520px
max-width: 500px
max-width: 480px *
max-width: 400px *
max-width: 380px
max-width: 320px *
```

Those marked * seem to be more commonly used than the others.

Try to use existing breakpoints, and as few of them as possible, rather than adding new ones to avoid fragmentation.