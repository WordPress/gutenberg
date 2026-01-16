# Slider Block

A CSS-based slider block that uses scroll-snap for native browser scrolling with JavaScript enhancements via the Interactivity API.

## Block Structure

The Slider is composed of four blocks:

- **Slider** (`core/slider`) - Main container block
- **Slider Track** (`core/slider-track`) - The scrollable container that holds slides
- **Slide** (`core/slide`) - Individual slides that can contain any blocks
- **Slider Controls** (`core/slider-controls`) - Previous/Next navigation buttons

## Features

### CSS-Based Scrolling
- Uses `scroll-snap-type` and `scroll-snap-align` for smooth native scrolling
- Works with touch/swipe gestures on mobile devices
- No JavaScript required for basic functionality

### JavaScript Enhancements (Interactivity API)
- Arrow button navigation
- Keyboard navigation (left/right arrow keys)
- Disabled states for buttons at start/end
- ARIA labels and accessibility features
- Scroll position tracking

### Editor Experience
- Slides are displayed side-by-side in the editor for easier editing
- Scrolling is disabled in the editor to prevent accidental navigation
- Each slide can contain any blocks

## Usage

### Enabling the Block

The Slider block is experimental. To enable it, add this to your WordPress config:

```php
define( 'GUTENBERG_ENABLE_BLOCK_EXPERIMENTS', true );
```

Or enable via browser console:

```javascript
window.__experimentalEnableBlockExperiments = true;
```

### Default Structure

When you insert a Slider block, it comes with:
- Slider Controls (Previous/Next buttons)
- Slider Track containing 3 empty slides

### Customizing Slides

Each slide is a generic container that accepts any blocks. You can:
- Add images, paragraphs, headings, or any other blocks
- Apply background colors and borders
- Use layout controls (flex, grid, etc.)
- Add padding and spacing

## Technical Details

### Scroll Behavior

The slider uses native browser scrolling with CSS `scroll-snap`:

```css
.wp-block-slider-track {
  display: flex;
  overflow-x: scroll;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}

.wp-block-slide {
  scroll-snap-align: start;
  flex-shrink: 0;
  width: 100%;
}
```

### State Management

The Interactivity API manages:
- `currentIndex` - Current slide index (0-based)
- `totalSlides` - Total number of slides
- `isAtStart` - Whether at first slide
- `isAtEnd` - Whether at last slide

### Actions

- `nextSlide()` - Scroll to next slide
- `prevSlide()` - Scroll to previous slide
- `handleScroll()` - Debounced scroll handler that updates state

### Accessibility

- Track has `role="region"` and `aria-roledescription="carousel"`
- ARIA labels announce current slide position
- Keyboard navigation with arrow keys
- Focus management
- Buttons disabled at boundaries

## Future Enhancements

Potential future additions:
- Pagination dots
- Auto-advance option (with pause on hover)
- Slides per view configuration (responsive)
- Vertical slider orientation
- Transition effects
- Gallery carousel variation
- Query Loop carousel variation

## Development

### Building

```bash
npm run build
```

### File Structure

```
slider/
├── block.json          # Block configuration
├── index.js           # Registration
├── edit.js            # Editor component
├── save.js            # Frontend markup
├── view.js            # Interactivity API logic
├── icon.js            # Block icon
├── style.scss         # Frontend styles
└── editor.scss        # Editor-only styles
```

## Related Issues

- [#43369](https://github.com/WordPress/gutenberg/issues/43369) - New Block: Slider Container (CSS based)
- [#25501](https://github.com/WordPress/gutenberg/issues/25501) - Display Posts in Carousel (Query Loop?)
