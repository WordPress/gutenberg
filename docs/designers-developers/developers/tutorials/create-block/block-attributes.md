
# Block Attributes

Attributes are the way a block stores data, they define how a block is parsed to extract data from the saved content.

For this block tutorial, we want to allow the user to type in a message that we will display stylized in the published post. So, we need to add a **message** attribute that will hold the user message. The following code defines a **message** attribute; the attribute type is a string; the source is the text from the selector which is a `div` tag.

```js
attributes: {
    message: {
        type: 'string',
        source: 'text',
        selector: 'div',
    },
},
```

Add this to the `index.js` file within the `registerBlockType` function in `index.js`, `attributes` are at the same level as the title and description fields.

To repeat, when the block loads it will look at the saved content for the block, look for the div tag, take the text portion — the part in between the open and close div tags —  and store the content in an `attributes.message` variable.

For more details and other examples see the [Block Attributes documentation](/docs/designers-developers/developers/block-api/block-attributes.md).

## Edit and Save

The **attributes** are passed to the `edit` and `save` functions, along with a  **setAttributes** parameters for setting the values after the user enters. Additional parameters are also passed in to this functions, see [the edit/save documentation](/docs/designers-developers/developers/block-api/block-edit-save.md) for more details.

The attributes is a JavaScript object containing the values of each attribute, or default values if defined. The setAttributes is a function to update an attribute. If you are familiar with React, this is similar to state and setState.

## TextControl Component

For this example block, the component we are going to use is the **TextControl** component, it is similar to an HTML text input field. You can see [documentation for TextControl component](/packages/components/src/text-control/README.md) and a complete list of components in the handbook. You can also browse an [interactive set of components in this Storybook](https://wordpress.github.io/gutenberg/).

The component is added similar to an HTML tag, setting a label, the `value` is set to the `attributes.message` and the `onChange` function uses the `setAttributes` to update the url attribute value.

The save function will simply write the `attributes.message` as a div tag since that is how we defined it to be parsed.

Update the edit.js and save.js files to the following, replacing the existing functions.

**edit.js**

```js
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, className, setAttributes } ) {
    return (
        <div className={ className }>
            <TextControl
                label={ __( "Message", "create-block" ) }
                value={ attributes.message }
                onChange={ ( val ) => setAttributes( { message: val } ) }
            />
        </div>
    );
}
```


**save.js**

```jsx
export default function Save( { attributes, className } ) {
	return (
		<div className={ className }>
			{ attributes.message }
		</div>
	);
}
```

With that code in place, rebuild the block using `npm run build`, reload the editor and add the block. You should be able to type a message in the editor, and on save, view it in the post.