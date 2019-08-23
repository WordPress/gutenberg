# Sandbox

This component provides an isolated environment for arbitrary HTML via iframes.

## Usage

<!-- wp:docs/sandbox { "name": "name" } -->
```jsx
import { SandBox } from '@wordpress/components';

const Example = () => (
	<SandBox
		html="<p>Content</p>"
		title="Sandbox"
		type="embed"
	/>
);
```
<!-- /wp:docs/sandbox -->
