# Image Cropper Next

An experimental, modular image cropper for WordPress with rectangle and freeform polygon support.

## Installation

This is a private package. Install it within the Gutenberg monorepo:

```bash
npm install @wordpress/image-cropper-next
```

## Features

-   Rectangular crop with resize handles and aspect ratio lock
-   Freeform polygon crop with vertex dragging
-   Rotate, flip, and zoom
-   Container-responsive (fits parent dimensions)
-   JSON-serializable transform operations (AI-agent friendly)
-   Non-destructive pipeline (undo/redo ready)
-   Canvas export with configurable MIME type

## Architecture

Three layers:

1. **Core** (`src/core/`) — Zero-dependency pure functions for math, transforms, and export. Fully testable without React.
2. **Hooks** (`src/hooks/`) — Thin React bindings over the core layer.
3. **Components** (`src/components/`) — Rendering only. Composable via the stencil pattern.

## Usage

```jsx
import { Cropper, useCropperState, RectangleStencil } from '@wordpress/image-cropper-next';

function MyEditor() {
	const { state, dispatch } = useCropperState();
	return (
		<Cropper
			src="https://example.com/image.jpg"
			state={ state }
			dispatch={ dispatch }
			stencil={ RectangleStencil }
		/>
	);
}
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. It is currently experimental and private.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
