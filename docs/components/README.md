# Component Reference

WordPress includes a library of generic components to be used for creating common UI elements shared between screens and features of the WordPress dashboard.

## Using the Components via WorPress Global

Components are available as a registered script in WordPress and can be accessed using the `wp` global variable.

If you wanted to use the `Button` component, first you would specify `wp-components` as a dependency when you enqueue your script:

```php
wp_enqueue_script(
	'my-custom-block',
	plugins_url( $block_path, __FILE__ ),
	array( 'wp-components' )
);
```

After the dependency is declared, you can access the module in your JavaScript code using the global `wp` like so:

```jsx
const { Button } = wp.components;

export default function MyButton() {
	return <Button>Click Me!</Button>;
}
```

## Using the Components via npm

All the components are also available on [npm](https://www.npmjs.com/org/wordpress) if you want to bundle them in your code.

Using the same `Button` example, you would install the block editor module with npm:

```bash
npm install @wordpress/components --save
```

Once installed, you can access the component in your code using:

```jsx
import { Button } from '@wordpress/components';

export default function MyButton() {
	return <Button>Click Me!</Button>;
}
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
