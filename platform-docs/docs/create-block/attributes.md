---
sidebar_position: 2
---

# Block Attributes

Attributes are the way a block stores data, they define the structure of a block. Upon serialization, some attributes are saved into the HTML output while others are kept in a the HTML block comment delimiters.

For this block tutorial, we want to allow the user to type a message that we will display stylized in the saved content. So, we need to add a **message** attribute that will hold the user message. The following code defines a **message** attribute; the attribute type is a string. When serializing the blocks, the message will be saved within a `div`container. This means that we're going to source the value attribute using `text` source from the selector, which is a `div` tag.

```js
const attributes = {
	message: {
		type: 'string',
		source: 'text',
		selector: 'div',
		'default': ''
	}
};
```

Add this to the settings arguments of the `registerBlockType` function call. 

**Note:** The text source is equivalent to `innerText` attribute of a DOM element.

## Edit and Save

The **attributes** are passed to both the `edit` and `save` functions. The **setAttributes** function is also passed, but only to the `edit` function. The **setAttributes** function is used to set the values.

The `attributes` is a JavaScript object containing the values of each attribute, or default values if defined. The `setAttributes` is a function to update an attribute.

```js
function Edit( { attributes, setAttributes } ) {
	// ...
}

function Save( { attributes } ) {
	// ...
}

registerBlockType( 'create-block/gutenpride', {
    // ...
    attributes,
    edit: Edit,
    save: Save,
} );
```

## PlainText Component

For our example block, the component we are going to use is the **PlainText** component, which allows the user to type some unformatted text. The **PlainText** component is imported from the `@wordpress/block-editor` package.

The component is added similar to an HTML tag, the `value` is set to the `attributes.message` and the `onChange` function uses the `setAttributes` to update the message attribute value.

The save function will simply write the `attributes.message` as a `div` tag since that is how we defined it to be parsed. Update the `edit.js` and `save.js` files to the following, replacing the existing functions.

**edit.js** file:

```js
import { useBlockProps, PlainText } from '@wordpress/block-editor';

function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	return (
		<PlainText
			{ ...blockProps }
			tagName="div"
			value={ attributes.message }
			onChange={ ( val ) => setAttributes( { message: val } ) }
			__experimentalVersion={ 2 }
		/>
	);
}
```

**save.js** file:

```jsx
import { useBlockProps } from '@wordpress/block-editor';

function Save( { attributes } ) {
	const blockProps = useBlockProps.save();
	return <div { ...blockProps }>{ attributes.message }</div>;
}
```

Reload the editor and add the block. You can now type a message in the editor and it will be included in the serialized HTML output.
