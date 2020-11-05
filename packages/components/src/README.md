Components
==========

This directory includes a library of generic React components to be used for creating common UI elements shared between screens and features of the WordPress dashboard.

## Usage

Within Gutenberg, these components can be accessed by importing from the `components` root directory:

```jsx
/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

const MyButton = () => {
	return <Button>Click Me!</Button>;
}
```

Many components also include styles which will need to be output in order to appear correctly. Within WordPress, you can [add the `wp-components` stylesheet as a dependency of your plugin's stylesheet](https://developer.wordpress.org/reference/functions/wp_enqueue_style/#parameters). In other projects, you can link to the `build-style/style.css` file directly.
