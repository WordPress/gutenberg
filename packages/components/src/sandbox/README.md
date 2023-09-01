# SandBox

This component provides an isolated environment for arbitrary HTML via iframes.

## Usage

```jsx
import { SandBox } from '@wordpress/components';

const MySandBox = () => (
	<SandBox html="<p>Content</p>" title="SandBox" type="embed" />
);
```

## Props

### `html`: `string`

The HTML to render in the body of the iframe document.

-   Required: No
-   Default: ""

### `onFocus`: `React.DOMAttributes< HTMLIFrameElement >[ 'onFocus' ]`

The `onFocus` callback for the iframe.

-   Required: No

### `scripts`: `string[]`

An array of script URLs to inject as `<script>` tags into the bottom of the `<body>` of the iframe document.

-   Required: No
-   Default: []

### `styles`: `string[]`

An array of CSS strings to inject into the `<head>` of the iframe document.

-   Required: No
-   Default: []

### `title`: `string`

The `<title>` of the iframe document.

-   Required: No
-   Default: ""

### `type`: `string`

The CSS class name to apply to the `<html>` and `<body>` elements of the iframe.

-   Required: No
-   Default: ""