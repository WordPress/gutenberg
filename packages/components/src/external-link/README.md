# ExternalLink

Link to an external resource.

## Usage

```jsx
import { ExternalLink } from '@wordpress/components';

const MyExternalLink = () => (
	<ExternalLink href="https://wordpress.org">WordPress.org</ExternalLink>
);
```

## Props

The component accepts the following props. Any other props will be passed through to the `a`.

### `children`: `ReactNode`

The content to be displayed within the link.

-   Required: Yes

### `href`: `string`

The URL of the external resource.

-   Required: Yes
