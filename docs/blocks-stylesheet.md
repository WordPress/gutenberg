# Adding a stylesheet

```js
// block.js (ES5)
var el = wp.element.createElement;

wp.blocks.registerBlockType( 'mytheme/block', {
	title: 'Hello World (step 2)',
	icon: 'universal-access-alt',
	category: 'layout',
	edit: function( props ) {
		return el( 'p', { className: props.className }, 'Hello World' );
	},
	save: function() {
		return el( 'p', 'Hello World' );
	},
} );
```

```js
// block.js (ESnext)
const { registerBlockType } = wp.blocks;

registerBlockType( 'mytheme/block', {
	title: 'Hello Block',
	icon: 'universal-access-alt',
	category: 'layout',
	edit( { className } ) {
		return <div className={ className }>Hello World</div>;
	},
	save() {
		return <div>Hello World</div>;
	},
} );
```

```css
/* style.css */

/**
 * Note that these styles are loaded *before* editor styles, so that
 * editor-specific styles using the same selectors will take precedence.
 */
.wp-block-mytheme-block {
	color: darkred;
	background: #fcc;
	border: 2px solid #c99;
	padding: 20px;
}
```

```css
/* editor.css */

/**
 * Note that these styles are loaded *after* common styles, so that
 * editor-specific styles using the same selectors will take precedence.
 */
.wp-block-mytheme-block {
	color: green;
	background: #cfc;
	border: 2px solid #9c9;
	padding: 20px;
}
```
