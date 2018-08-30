# IconButton

**Note:** For accessibility reasons, icon buttons that have no text and use only an icon must expose their aria-label visually via the tooltip; in these cases, never set the tooltip prop to `false`.

## Usage

```jsx
import { IconButton } from '@wordpress/components';

const MyIconButton = () => (
	<IconButton
		icon="ellipsis"
		label="More"
	/>
);
```
