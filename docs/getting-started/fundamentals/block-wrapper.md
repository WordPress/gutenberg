# The block wrapper

Every block in the Block Editor is contained within an HTML wrapper, which must have specific attributes to function correctly both in the Editor and on the front end. As developers, we can directly manipulate this markup, and WordPress offers tools like `useBlockProps()` to modify the attributes added to a block's wrapper.

Ensuring proper attributes to the block wrapper is especially important when using custom styling or features like [block supports](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/).

A block in WordPress can be defined with three distinct types of markup, each serving a unique role:

- **Editor Markup:** This is the visual representation of the block within the Block Editor. It's defined using an `Edit` React component when the block is registered on the client side via [`registerBlockType`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/#registerblocktype).
- **Save Markup:** This markup is what gets saved to the database when the block's content is saved. It's specified through a `save` function, also provided to `registerBlockType` during block registration. If the block doesn't utilize dynamic rendering, this saved markup is what will be displayed on the front end.
- **Dynamic Render Markup:** When a block's content needs to be generated dynamically, this markup comes into play. It's defined server-side, either through a `render_callback` function in [`register_block_type`](https://developer.wordpress.org/reference/functions/register_block_type/) or a [`render.php`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#render) file specified in `block.json`. If present, this markup overrides any saved markup and is used for the block's front-end display.

For both the [`Edit` component and the `save` function](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/), it's important to use a wrapper element that's a standard DOM element (like a `<div>`) or a React component that passes all additional props to native DOM elements. Using React Fragments (`<Fragment>`) or the `<ServerSideRender>` component won't work for these wrappers.

## Editor markup

The [`useBlockProps()`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops) hook, provided by the [`@wordpress/block-editor`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor) package, is used to define the outer markup of a block in the `Edit` component.

This hook simplifies several tasks, including:

- Assigning a unique `id` to the block's HTML structure.
- Adding various accessibility and `data-` attributes for enhanced functionality and information.
- Incorporating classes and inline styles that reflect the block's custom settings. By default, this includes:
    - The `wp-block` class for general block styling.
    - A block-specific class that combines the block's namespace and name, ensuring unique and targeted styling capabilities.

In the following example, the Editor markup of the block is defined in the `Edit` component using the `useBlockProps()` hook.

```js
const Edit = () => <p { ...useBlockProps() }>Hello World - Block Editor</p>;

registerBlockType( ..., {
	edit: Edit
} );
```

_See the [full block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/minimal-block-ca6eda) of the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/minimal-block-ca6eda/src/index.js)._

The markup of the block in the Block Editor could look like this, where the classes and attributes are applied automatically:

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

In a block's `Edit` component, use the `useBlockProps()` hook to include additional classes and attributes by passing them as arguments. (See [example](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/stylesheets-79a4c3/src/edit.js))

When you enable features using the `supports` property, any corresponding classes or attributes are included in the object returned by `useBlockProps` automatically.

## Save markup

When saving the markup in the database, it’s important to add the props returned by `useBlockProps.save()` to the wrapper element of your block. `useBlockProps.save()` ensures that the block class name is rendered correctly in addition to any HTML attributes injected by the block supports API.

Consider the following code that registers a block in the client. Notice how it defines the markup that should be used when editing the block and when the block is saved in the database.

```js
const Edit = () => <p { ...useBlockProps() }>Hello World - Block Editor</p>;
const save = () => <p { ...useBlockProps.save() }>Hello World - Frontend</p>;

registerBlockType( ..., {
	edit: Edit,
	save,
} );
```

_See the [full block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/minimal-block-ca6eda) of the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/minimal-block-ca6eda/src/index.js)._

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

## Dynamic render markup

In dynamic blocks, where the front-end markup is rendered server-side, you can utilize the [`get_block_wrapper_attributes()`](https://developer.wordpress.org/reference/functions/get_block_wrapper_attributes/) function to output the necessary classes and attributes just like you would use `useBlockProps.save()` in the `save` function. (See [example](https://github.com/WordPress/block-development-examples/blob/f68640f42d993f0866d1879f67c73910285ca114/plugins/block-dynamic-rendering-64756b/src/render.php#L11))

```php
<p <?php echo get_block_wrapper_attributes(); ?>>
	<?php esc_html_e( 'Block with Dynamic Rendering – hello!!!', 'block-development-examples' ); ?>
</p>
```
