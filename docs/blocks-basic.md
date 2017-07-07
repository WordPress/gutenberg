# Writing your first block

```js
// block.js (ES5)
var el = wp.element.createElement;
var blockStyle = { backgroundColor: '#900', color: '#fff', padding: '20px' };

wp.blocks.registerBlockType( 'mytheme/block', {
	title: 'Hello World (step 1)',
	icon: 'universal-access-alt',
	category: 'layout',
	edit: function() {
		return el( 'p', { style: blockStyle }, 'Hello World' );
	},
	save: function() {
		return el( 'p', { style: blockStyle }, 'Hello World' );
	},
} );
```

```js
// block.js (ESnext)
const { registerBlockType } = wp.blocks;
const blockStyle = { backgroundColor: '#900', color: '#fff', padding: '20px' };

registerBlockType( 'mytheme/block', {
	title: 'Hello Block',
	icon: 'universal-access-alt',
	category: 'layout',
	edit() {
		return <div style={ blockStyle }>Hello World</div>;
	},
	save() {
		return <div style={ blockStyle }>Hello World</div>;
	},
} );
```
