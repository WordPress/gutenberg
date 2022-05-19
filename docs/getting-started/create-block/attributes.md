# Block Attributes

Attributes are the way a block stores data, they define how a block is parsed to extract data from the saved content.

For this block tutorial, we want to allow the user to type in a message that we will display stylized in the published post. So, we need to add a **message** attribute that will hold the user message. The following code defines a **message** attribute; the attribute type is a string; the source is the text from the selector which is a `div` tag.

```json
"attributes": {
	"message": {
		"type": "string",
		"source": "text",
		"selector": "div",
		"default": ""
	}
},
```

Add this to the `block.json` file. The `attributes` are at the same level as the _name_ and _title_ fields.

When the block loads it will look at the saved content for the block, look for the div tag, take the text portion, and store the content in an `attributes.message` variable.

Note: The text portion is equivalent to `innerText` attribute of a DOM element. For more details and other examples see the [Block Attributes documentation](/docs/reference-guides/block-api/block-attributes.md).

## Edit and Save

The **attributes** are passed to the `edit` and `save` functions, along with a **setAttributes** function to set the values. Additional parameters are also passed in to these functions, see [the edit/save documentation](/docs/reference-guides/block-api/block-edit-save.md) for more details.

The `attributes` is a JavaScript object containing the values of each attribute, or default values if defined. The `setAttributes` is a function to update an attribute.

```js
export default function Edit( { attributes, setAttributes } ) {
	// ...
}
```

## TextControl Component

For our example block, the component we are going to use is the **TextControl** component, it is similar to an HTML text input field. You can see [documentation for TextControl component](/packages/components/src/text-control/README.md). You can browse an [interactive set of components in this Storybook](https://wordpress.github.io/gutenberg/).

The component is added similar to an HTML tag, setting a label, the `value` is set to the `attributes.message` and the `onChange` function uses the `setAttributes` to update the message attribute value.

The save function will simply write the `attributes.message` as a div tag since that is how we defined it to be parsed.

OPTIONAL: For IDE support (code completion and hints), you can install the `@wordpress/components` module which is where the TextControl component is imported from. This install command is optional since the build process automatically detects `@wordpress/*` imports and specifies as dependencies in the assets file.

```shell
npm install @wordpress/components --save
```

Update the edit.js and save.js files to the following, replacing the existing functions.

**edit.js** file:

```js
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { TextControl } from '@wordpress/components';
import './editor.scss';

export default function Edit( { attributes, setAttributes } ) {
	return (
		<div { ...useBlockProps() }>
			<TextControl
				label={ __( 'Message', 'gutenpride' ) }
				value={ attributes.message }
				onChange={ ( val ) => setAttributes( { message: val } ) }
			/>
		</div>
	);
}
```

**save.js** file:

```jsx
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const blockProps = useBlockProps.save();
	return <div { ...blockProps }>{ attributes.message }</div>;
}
```

If you have previously run `npm run start`, and the script is still running, you can reload the editor now and add the block to test.
Otherwise rebuild the block using `npm run build`, reload the editor and add the block. Type a message in the editor, save, and view it in the post.

Next Section: [Code Implementation](/docs/getting-started/create-block/block-code.md)
