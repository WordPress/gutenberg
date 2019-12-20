# Edit and Save

When registering a block, the `edit` and `save` functions provide the interface for how a block is going to be rendered within the editor, how it will operate and be manipulated, and how it will be saved.

## Edit

The `edit` function describes the structure of your block in the context of the editor. This represents what the editor will render when the block is used.

{% codetabs %}
{% ES5 %}
```js
// A static div
edit: function() {
	return wp.element.createElement(
		'div',
		null,
		'Your block.'
	);
}
```
{% ESNext %}
```jsx
edit: () => {
	return <div>Your block.</div>;
}
```
{% end %}

The function receives the following properties through an object argument:

### attributes

This property surfaces all the available attributes and their corresponding values, as described by the `attributes` property when the block type was registered. See [attributes documentation](/docs/designers-developers/developers/block-api/block-attributes.md) for how to specify attribute sources.

In this case, assuming we had defined an attribute of `content` during block registration, we would receive and use that value in our edit function:

{% codetabs %}
{% ES5 %}
```js
edit: function( props ) {
	return wp.element.createElement(
		'div',
		null,
		props.attributes.content
	);
}
```
{% ESNext %}
```js
edit: ( { attributes } ) => {
	return <div>{ attributes.content }</div>;
}
```
{% end %}

The value of `attributes.content` will be displayed inside the `div` when inserting the block in the editor.

### className

This property returns the class name for the wrapper element. This is automatically added in the `save` method, but not on `edit`, as the root element may not correspond to what is _visually_ the main element of the block. You can request it to add it to the correct element in your function.

{% codetabs %}
{% ES5 %}
```js
edit: function( props ) {
	return wp.element.createElement(
		'div',
		{ className: props.className },
		props.attributes.content
	);
}
```
{% ESNext %}
```js
edit: ( { attributes, className } ) => {
	return <div className={ className }>{ attributes.content }</div>;
}
```
{% end %}

### isSelected

The isSelected property is an object that communicates whether the block is currently selected.

{% codetabs %}
{% ES5 %}
```js
edit: function( props ) {
	return wp.element.createElement(
		'div',
		{ className: props.className },
		[
			'Your block.',
			props.isSelected ? wp.element.createElement(
				'span',
				null,
				'Shows only when the block is selected.'
			)
		]
	);
}
```
{% ESNext %}
```jsx
edit: ( { attributes, className, isSelected } ) => {
	return (
		<div className={ className }>
			Your block.
			{ isSelected &&
				<span>Shows only when the block is selected.</span>
			}
		</div>
	);
}
```
{% end %}

### setAttributes

This function allows the block to update individual attributes based on user interactions.

{% codetabs %}
{% ES5 %}
```js
edit: function( props ) {
	// Simplify access to attributes
	let content = props.attributes.content;
	let mySetting = props.attributes.mySetting;

	// Toggle a setting when the user clicks the button
	let toggleSetting = () => props.setAttributes( { mySetting: ! mySetting } );
	return wp.element.createElement(
		'div',
		{ className: props.className },
		[
			content,
			props.isSelected ? wp.element.createElement(
				'button',
				{ onClick: toggleSetting },
				'Toggle setting'
			) : null
		]
	);
},
```
{% ESNext %}
```jsx
edit: ( { attributes, setAttributes, className, isSelected } ) => {
	// Simplify access to attributes
	const { content, mySetting } = attributes;

	// Toggle a setting when the user clicks the button
	const toggleSetting = () => setAttributes( { mySetting: ! mySetting } );
	return (
		<div className={ className }>
			{ content }
			{ isSelected &&
				<button onClick={ toggleSetting }>Toggle setting</button>
			}
		</div>
	);
}
```
{% end %}

When using attributes that are objects or arrays it's a good idea to copy or clone the attribute prior to updating it:

{% codetabs %}
{% ES5 %}
```js
// Good - cloning the old list
var newList = attributes.list.slice();

var addListItem = function( newListItem ) {
	setAttributes( { list: newList.concat( [ newListItem ] ) } );
};

// Bad - the list from the existing attribute is modified directly to add the new list item:
var list = attributes.list;
var addListItem = function( newListItem ) {
	list.push( newListItem );
	setAttributes( { list: list } );
};
```
{% ESNext %}
```js
// Good - a new array is created from the old list attribute and a new list item:
const { list } = attributes;
const addListItem = ( newListItem ) => setAttributes( { list: [ ...list, newListItem ] } );

// Bad - the list from the existing attribute is modified directly to add the new list item:
const { list } = attributes;
const addListItem = ( newListItem ) => {
	list.push( newListItem );
	setAttributes( { list } );
};
```
{% end %}

Why do this? In JavaScript, arrays and objects are passed by reference, so this practice ensures changes won't affect other code that might hold references to the same data. Furthermore, the Gutenberg project follows the philosophy of the Redux library that [state should be immutable](https://redux.js.org/faq/immutable-data#what-are-the-benefits-of-immutability)—data should not be changed directly, but instead a new version of the data created containing the changes.

## Save

The `save` function defines the way in which the different attributes should be combined into the final markup, which is then serialized into `post_content`.

{% codetabs %}
{% ES5 %}
```js
save: function() {
	return wp.element.createElement(
		'div',
		null,
		'Your block.'
	);
}
```
{% ESNext %}
```jsx
save: () => {
	return <div> Your block. </div>;
}
```
{% end %}

For most blocks, the return value of `save` should be an [instance of WordPress Element](/packages/element/README.md) representing how the block is to appear on the front of the site.

_Note:_ While it is possible to return a string value from `save`, it _will be escaped_. If the string includes HTML markup, the markup will be shown on the front of the site verbatim, not as the equivalent HTML node content. If you must return raw HTML from `save`, use `wp.element.RawHTML`. As the name implies, this is prone to [cross-site scripting](https://en.wikipedia.org/wiki/Cross-site_scripting) and therefore is discouraged in favor of a WordPress Element hierarchy whenever possible.

_Note:_ The save function should be a pure function that depends only on the attributes used to invoke it.
It can not have any side effect or retrieve information from another source, e.g. it is not possible to use the data module inside it `select( store ).selector( ... )`.
This is because if the external information changes, the block may be flagged as invalid when the post is later edited ([read more about Validation](#validation)).
If there is a need to have other information as part of the save, developers can consider one of these two alternatives:
 - Use [dynamic blocks](/docs/designers-developers/developers/tutorials/block-tutorial/creating-dynamic-blocks.md) and dynamically retrieve the required information on the server.
 - Store the external value as an attribute which is dynamically updated in the block's `edit` function as changes occur.

For [dynamic blocks](/docs/designers-developers/developers/tutorials/block-tutorial/creating-dynamic-blocks.md), the return value of `save` could represent a cached copy of the block's content to be shown only in case the plugin implementing the block is ever disabled.

If left unspecified, the default implementation will save no markup in post content for the dynamic block, instead deferring this to always be calculated when the block is shown on the front of the site.

### attributes

As with `edit`, the `save` function also receives an object argument including attributes which can be inserted into the markup.

{% codetabs %}
{% ES5 %}
```js
save: function( props ) {
	return wp.element.createElement(
		'div',
		null,
		props.attributes.content
	);
}
```
{% ESNext %}
```jsx
save: ( { attributes } ) => {
	return <div>{ attributes.content }</div>;
}
```
{% end %}


When saving your block, you want to save the attributes in the same format specified by the attribute source definition. If no attribute source is specified, the attribute will be saved to the block's comment delimiter. See the [Block Attributes documentation](/docs/designers-developers/developers/block-api/block-attributes.md) for more details.

## Examples

Here are a couple examples of using attributes, edit, and save all together.  For a full working example, see the [Introducing Attributes and Editable Fields](/docs/designers-developers/developers/tutorials/block-tutorial/introducing-attributes-and-editable-fields.md) section of the Block Tutorial.

### Saving Attributes to Child Elements

{% codetabs %}
{% ES5 %}
```js
attributes: {
	content: {
		type: 'string',
		source: 'html',
		selector: 'p'
	}
},

edit: function( props ) {
	var updateFieldValue = function( val ) {
		props.setAttributes( { content: val } );
	}
	return wp.element.createElement(
		wp.components.TextControl,
		{
			label: 'My Text Field',
			value: props.attributes.content,
			onChange: updateFieldValue,

		}
	);
},

save: function( props ) {
	return el( 'p', {}, props.attributes.content );
},
```
{% ESNext %}
```jsx
attributes: {
	content: {
		type: 'string',
		source: 'html',
		selector: 'p'
	}
},

edit: ( { attributes, setAttributes } ) => {
	const updateFieldValue = ( val ) => {
		setAttributes( { content: val } );
	}
	return <TextControl
			label='My Text Field'
			value={ attributes.content }
			onChange={ updateFieldValue }
		/>;
},

save: ( { attributes } ) => {
	return <p> { attributes.content } </p>;
},
```
{% end %}

### Saving Attributes via Serialization

Ideally, the attributes saved should be included in the markup. However, there are times when this is not practical, so if no attribute source is specified the attribute is serialized and saved to the block's comment delimiter.

This example could be for a dynamic block, such as the [Latest Posts block](https://github.com/WordPress/gutenberg/blob/master/packages/block-library/src/latest-posts/index.js), which renders the markup server-side. The save function is still required, however in this case it simply returns null since the block is not saving content from the editor.

{% codetabs %}
{% ES5 %}
```js
attributes: {
	postsToShow: {
		type: 'number',
	}
},

edit: function( props ) {
	return wp.element.createElement(
		wp.components.TextControl,
		{
			label: 'Number Posts to Show',
			value: props.attributes.postsToShow,
			onChange: function( val ) {
				props.setAttributes( { postsToShow: parseInt( val ) } );
			},
		}
	);
},

save: function() {
	return null;
}
```
{% ESNext %}
```jsx
attributes: {
	postsToShow: {
		type: 'number',
	}
},

edit: ( { attributes, setAttributes } ) => {
	return <TextControl
			label='Number Posts to Show'
			value={ attributes.postsToShow }
			onChange={ ( val ) => {
				setAttributes( { postsToShow: parseInt( val ) } );
			}},
		}
	);
},

save: () => {
	return null;
}
```
{% end %}


## Validation

When the editor loads, all blocks within post content are validated to determine their accuracy in order to protect against content loss. This is closely related to the saving implementation of a block, as a user may unintentionally remove or modify their content if the editor is unable to restore a block correctly. During editor initialization, the saved markup for each block is regenerated using the attributes that were parsed from the post's content. If the newly-generated markup does not match what was already stored in post content, the block is marked as invalid. This is because we assume that unless the user makes edits, the markup should remain identical to the saved content.

If a block is detected to be invalid, the user will be prompted to choose how to handle the invalidation:

![Invalid block prompt](https://user-images.githubusercontent.com/1779930/35637234-a6a7a18a-0681-11e8-858b-adfc1c6f47da.png)

- **Overwrite**: Ignores the warning and treats the newly generated markup as correct. As noted in the behavior described above, this can result in content loss since it will overwrite the markup saved in post content.
- **Convert to Classic**: Protects the original markup from the saved post content as correct. Since the block will be converted from its original type to the Classic block type, it will no longer be possible to edit the content using controls available for the original block type.
- **Edit as HTML block**: Similar to _Convert to Classic_, this will protect the original markup from the saved post content and convert the block from its original type to the HTML block type, enabling the user to modify the HTML markup directly.

### Validation FAQ

**How do blocks become invalid?**

The two most common sources of block invalidations are:

1. A flaw in a block's code would result in unintended content modifications. See the question below on how to debug block invalidation as a plugin author.
2. You or an external editor changed the HTML markup of the block in such a way that it is no longer considered correct.

**I'm a plugin author. What should I do to debug why my blocks are being marked as invalid?**

Before starting to debug, be sure to familiarize yourself with the validation step described above documenting the process for detecting whether a block is invalid. A block is invalid if its regenerated markup does not match what is saved in post content, so often this can be caused by the attributes of a block being parsed incorrectly from the saved content.

If you're using [attribute sources](/docs/designers-developers/developers/block-api/block-attributes.md), be sure that attributes sourced from markup are saved exactly as you expect, and in the correct type (usually a `'string'` or `'number'`).

When a block is detected as invalid, a warning will be logged into your browser's developer tools console. The warning will include specific details about the exact point at which a difference in markup occurred. Be sure to look closely at any differences in the expected and actual markups to see where problems are occurring.

**I've changed my block's `save` behavior and old content now includes invalid blocks. How can I fix this?**

Refer to the guide on [Deprecated Blocks](/docs/designers-developers/developers/block-api/block-deprecation.md) to learn more about how to accommodate legacy content in intentional markup changes.
