## Typewriter

The `Typewriter` component maintains consistent vertical positioning of the text caret during typing, creating a typewriter-like experience where the cursor stays at a fixed vertical position while the content scrolls beneath it. This component automatically handles scroll positioning to keep the active editing area in view during keyboard input.

The typewriter effect is particularly useful for long-form content editing, helping writers maintain focus by keeping the cursor at an optimal position on the screen rather than allowing it to drift to the bottom of the viewport.

## Development guidelines

### Usage

Wrap your editable content with the `Typewriter` component to enable automatic scroll positioning during typing:

```jsx
import { Typewriter } from '@wordpress/block-editor';

const MyEditableContent = () => (
	<Typewriter>
		<div contentEditable={ true }>Your editable content here...</div>
	</Typewriter>
);
```

The component automatically detects contentEditable elements within its children and applies the typewriter effect when they are focused and being edited.

### How it works

The typewriter effect is achieved by:

-   **Tracking caret position:** Monitors the text cursor location using `computeCaretRect`
-   **Maintaining scroll position:** Adjusts page/container scroll to keep the caret at a consistent vertical position
-   **Handling keyboard events:** Responds to typing (but not arrow key navigation) to trigger scroll adjustments
-   **Smart triggering:** Only activates after initial content reaches 75% of the viewport height

### Props

#### `children`

-   **Type:** `ReactNode`
-   **Default:**: `undefined`

The content to wrap with typewriter functionality. Should contain contentEditable elements for the effect to work.

### Browser Compatibility

The component automatically detects Internet Explorer and disables the typewriter effect for compatibility reasons, rendering only the children without the scroll behavior.

### Performance Considerations

-   Uses `requestAnimationFrame` for smooth scroll animations
-   Debounces scroll and resize events to prevent excessive calculations
-   Automatically cleans up event listeners when unmounted

### Behavior Details

#### Activation Conditions:

-   A block must be selected in the editor
-   The active element must be contentEditable
-   The component must contain the focused element

#### Scroll Behavior:

-   Maintains caret position during typing (non-arrow key input)
-   Resets position on arrow key navigation
-   Respects viewport boundaries to avoid scrolling caret out of view
-   Includes initial trigger threshold to prevent premature activation

#### Event Handling:

-   Keyboard input (keydown/keyup)
-   Mouse/touch selection changes
-   Window scroll and resize events

### Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a `BlockEditorProvider` in the components tree.

### Technical Implementation

The component uses a custom hook `useTypewriter()` that:

-   Utilizes `useRefEffect` from `@wordpress/compose` for ref management
-   Integrates with the block editor store to detect selected blocks
-   Employs `computeCaretRect` and `getScrollContainer` from `@wordpress/dom`
-   Handles both window-level and container-level scrolling scenarios
