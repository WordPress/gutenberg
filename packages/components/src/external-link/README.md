# ExternalLink

Renders a hyperlink that, when tapped or clicked, opens in a new window.

## Usage

```jsx
import { ExternalLink } from '@wordpress/components';

const MyExternalLink = () => (
	<ExternalLink href="https://wordpress.org">WordPress.org</ExternalLink>
);
```

## Props

The text that's displayed within the component's tags will be "clickable" and link to any URL provided via the `href` prop. As outlined below, the `href` prop is the only required prop.

There are two other optional props that are web only. That is, they're not available for use with the React Native implementation of the editor.

### `href`

The URL that is being linked to and will open in a new window when tapped or clicked.

-   Type: `String`
-   Required: Yes

### `className` (web only)

An optional CSS class that's added to the hyperlink's HTML.

-   Type: `String`
-   Required: No

### `rel` (web only)

A <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel">rel attribute</>.

-   Type: `String`
-   Required: No
