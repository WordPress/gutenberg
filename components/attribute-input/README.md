The `AttributeInput` component can be used to add an `input` to a block, whose value is always synchronized with a certain attribute.

#### Props

The following props are used to tell us which attrbute to connect the `input` to and how to update the attribute value. Any additional props will be passed to the rendered `<input />`.

* `attribute`: (string) the name of the block attribute to connect the `input` to.
* `setAttribute`: (function) the block's `setAttribute` function, we need it to be able to set the attribute value when the input changes.

#### Example:

```javascript
registerBlockType( 'example/hello', {
	title: __( 'Hello' ),
	icon: 'list-view',
	category: 'widgets',
	edit: ( { attributes, setAttributes } ) => (
		<span>Enter your name: <AttributeInput type="text" value={ attributes.name } placeholder="Baba" attribute="name" setAttributes={ setAttributes } /></span>
	),
	save: ( { attributes } ) => (
		<span>Hello, { attributes.name }!</span>
	),
} );
```
