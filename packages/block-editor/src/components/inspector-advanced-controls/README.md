# InspectorAdvancedControls

<img src="https://user-images.githubusercontent.com/150562/94028603-df90bf00-fdb3-11ea-9e6f-eb15c5631d85.png" width="280" alt="inspector-advanced-controls">

Inspector Advanced Controls appear under the _Advanced_ panel of a block's [InspectorControls](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-controls/README.md) -- that is, they appear as a specific set of controls within a block's settings panels. As the name suggests, `InspectorAdvancedControls` is meant for controls that most users aren't meant to interact with most of the time, such as adding an HTML anchor or custom CSS classes to a block.

## Usage

{% codetabs %}
{% ESNext %}

```js
const {
	TextControl,
} = wp.components;
const {
	InspectorControls,
	InspectorAdvancedControls,
} = wp.editor;

function MyBlockEdit( { attributes, setAttributes } ) {
	return (
		<>
			<div>
				{ /* Block markup goes here */ }
			</div
			<InspectorControls>
				{ /* Regular control goes here */
			</InspectorControls>
			<InspectorAdvancedControls>
				<TextControl
					label="HTML anchor"
					value={ attributes.anchor }
					onChange={ ( nextValue ) => {
						setAttributes( {
							anchor: nextValue,
						} );
					} }
				/>
			</InspectorAdvancedControls>
		</>
	);
}
```

{% ES5 %}

```js
var el = wp.element.createElement,
	Fragment = wp.element.Fragment,
	InspectorControls = wp.editor.InspectorControls,
	InspectorAdvancedControlsControls = wp.editor.InspectorAdvancedControls,
	TextControl = wp.components.TextControl,

function MyBlockEdit( props ) {
	return el( Fragment, null,
		el( 'div', null, /* Block markup goes here */ null ),
		el( InspectorControls, null, /* Regular control goes here */ null ),
		el( InspectorAdvancedControls, null,
			el( TextControl, {
				label: 'HTML anchor',
				value: props.attributes.anchor,
				onChange: function( nextValue ) {
					props.setAttributes( { anchor: nextValue } );
				}
			} )
		)
	);
}
```

{% end %}
