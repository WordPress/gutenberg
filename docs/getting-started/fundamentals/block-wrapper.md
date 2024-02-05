# The block wrapper

Each block's markup is wrapped by a container HTML tag that needs to have the proper attributes to fully work in the Block Editor and to reflect the proper block's style settings when rendered in the Block Editor and the front end. As developers, we have full control over the block's markup, and WordPress provides the tools to add the attributes that need to exist on the wrapper to our block's markup.

Ensuring proper attributes to the block wrapper is especially important when using custom styling or features like `supports`.

<div class="callout callout-info">
The use of <code>supports</code> generates a set of properties that need to be manually added to the wrapping element of the block so they're properly stored as part of the block data.
</div>

A block can have three sets of markup defined, each one of them with a specific target and purpose:

- The one for the **Block Editor**, defined through a `edit` React component passed to [`registerBlockType`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/#registerblocktype) when registering the block in the client.
- The one used to **save the block in the DB**, defined through a `save` function passed to `registerBlockType` when registering the block in the client.
    - This markup will be returned to the front end on request if no dynamic render has been defined for the block.
- The one used to **dynamically render the markup of the block** returned to the front end on request, defined through the `render_callback` on [`register_block_type`](https://developer.wordpress.org/reference/functions/register_block_type/) or the [`render`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#render) PHP file in `block.json`
    - If defined, this server-side generated markup will be returned to the front end, ignoring the markup stored in DB.

For the [`edit` React component and the `save` function](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/), the block wrapper element should be a native DOM element (like `<div>`) or a React component that forwards any additional props to native DOM elements. Using a `<Fragment>` or `<ServerSideRender>` component, for instance, would be invalid.


## The Edit component's markup

The [`useBlockProps()`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops) hook available on the [`@wordpress/block-editor`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor) allows passing the required attributes for the Block Editor to the `edit` block's outer wrapper.

Among other things, the `useBlockProps()` hook takes care of including in this wrapper:

- An `id` for the block's markup
- Some accessibility and `data-` attributes
- Classes and inline styles reflecting custom settings, which include by default:
    - The `wp-block` class
    - A class that contains the name of the block with its namespace

For example, for the following piece of code of a block's registration in the client...

```js
const Edit = () => <p { ...useBlockProps() }>Hello World - Block Editor</p>;

registerBlockType( ..., {
	edit: Edit
} );
```
_(see the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/minimal-block-ca6eda/src/index.js) in [an example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/minimal-block-ca6eda))_

...the markup of the block in the Block Editor could look like this:
```html
<p
    tabindex="0"
    id="block-4462939a-b918-44bb-9b7c-35a0db5ab8fe"
    role="document"
    aria-label="Block: Minimal Gutenberg Block ca6eda"
    data-block="4462939a-b918-44bb-9b7c-35a0db5ab8fe"
    data-type="block-development-examples/minimal-block-ca6eda"
    data-title="Minimal Gutenberg Block ca6eda"
    class="
        block-editor-block-list__block
        wp-block
        is-selected
        wp-block-block-development-examples-minimal-block-ca6eda
    "
>Hello World - Block Editor</p>
```

Any additional classes and attributes for the `Edit` component of the block should be passed as an argument of `useBlockProps` (see [example](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/stylesheets-79a4c3/src/edit.js)). When you add `supports` for any feature, they get added to the object returned by the `useBlockProps` hook.


## The Save component's markup

When saving the markup in the database, it’s important to add the props returned by `useBlockProps.save()` to the wrapper element of your block. `useBlockProps.save()` ensures that the block class name is rendered correctly in addition to any HTML attributes injected by the block supports API.

Consider the following code that registers a block in the client. Notice how it defines the markup that should be used when editing the block and when the block is saved in the database. (See [example](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/minimal-block-ca6eda/src/index.js))

```js
const Edit = () => <p { ...useBlockProps() }>Hello World - Block Editor</p>;
const save = () => <p { ...useBlockProps.save() }>Hello World - Frontend</p>;

registerBlockType( ..., {
	edit: Edit,
	save,
} );
```

The markup of the block on the front end could look like this, where the class is applied automatically:

```html
<p class="wp-block-block-development-examples-minimal-block-ca6eda">Hello World – Frontend</p>
```

If you want to add any additional classes or attributes to the `save` function of the block, they should be passed as an argument of `useBlockProps.save()`. (See [example](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/stylesheets-79a4c3/src/save.js))

When you add `supports` for any feature, the proper classes get added to the object returned by the `useBlockProps.save()` hook. Text and background color classes have been added to the Paragraph block in the example below.

```html
<p class="
    wp-block-block-development-examples-block-supports-6aa4dd
    has-accent-4-color
    has-contrast-background-color
    has-text-color
    has-background
">Hello World</p>
```

The [example block](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/block-supports-6aa4dd) that generated this HTML is available in the [Block Development Examples](https://github.com/WordPress/block-development-examples) repository.

## The server-side render markup

In dynamic blocks, where the font-end markup is rendered server-side, you can utilize the [`get_block_wrapper_attributes()`](https://developer.wordpress.org/reference/functions/get_block_wrapper_attributes/) function to output the necessary classes and attributes just like you would use `useBlockProps.save()` in the `save` function. (See [example](https://github.com/WordPress/block-development-examples/blob/f68640f42d993f0866d1879f67c73910285ca114/plugins/block-dynamic-rendering-64756b/src/render.php#L11))

```php
<p <?php echo get_block_wrapper_attributes(); ?>>
	<?php esc_html_e( 'Block with Dynamic Rendering – hello!!!', 'block-development-examples' ); ?>
</p>
```
