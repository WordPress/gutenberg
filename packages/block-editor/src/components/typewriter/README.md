# Typewriter

`Typewriter` is a component that maintains the vertical scroll position of the text selection (caret) within its wrapped content during keyboard interactions, producing a "typewriter" effect: the line being edited stays at a fixed distance from the top of the viewport rather than jumping around as content grows, shrinks, or is scrolled.

The effect is only active while a block is selected, and is skipped entirely in Internet Explorer due to caret-position APIs not being reliably supported there.

## Usage

Wrap the scrollable area containing the editable blocks with `Typewriter`:

```jsx
import Typewriter from './typewriter';

function VisualEditor() {
	return (
		<Typewriter>
			<BlockList />
		</Typewriter>
	);
}
```

### `useTypewriter`

The underlying behavior is also available as a hook, `useTypewriter`, which returns a ref callback. This is useful when the typewriter effect needs to be attached to an existing DOM node rather than rendering an additional wrapping `<div>`:

```jsx
import { useTypewriter } from './typewriter';

function VisualEditor() {
	const ref = useTypewriter();

	return <div ref={ ref }>{ /* ... */ }</div>;
}
```

`useTypewriter` is exposed outside the `block-editor` package as the private `__unstableUseTypewriter` API and is consumed by the `editor` package's `VisualEditor` component.
