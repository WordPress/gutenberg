# The Block wrapper

Each block's markup is wrapped by a container HTML tag that needs the proper attributes to fully work in the Block Editor and reflect the proper block's style settings when rendered in the Block Editor and the front end.

Three markups can be defined for a block:

- The one for the Block Editor, defined through a `edit` React component passed to `registerBlockType` when registering the block in the client. 
- The one used to save the block in the DB, defined through a `save` React component passed to `registerBlockType` when registering the block in the client. 
    - This markup will be returned to the front end on request if no dynamic render has been defined for the block.
- The one used to dynamically render the markup of the block returned to the front end on request, defined through the `render_callback` on `register_block_type` or the `render` PHP file in `block.json`
    - -----  If defined, this markup definition will take priority over the markup stored in DB ------

These markups are defined separately, but the recommendation is that they match each other so the block in the editor looks like as close as possible as how it will be rendered on the front end.

## The Edit component 

The markup of the `Edit` React component ` function is wrapped in a few other elements. The outer wrapper of each block has the wp-block class and a data-block attribute that contains the name of the block with its namespace – core/group for the group block, for example.


changes in blocks --- update store --- update blocks

To render the block element wrapper for the block’s edit implementation, the block author must use the `useBlockProps()` hook.

The generated class names and styles are no longer added automatically to the saved markup for static blocks when save is processed. To include them, the block author must explicitly use `useBlockProps.save()` and add to their block wrapper.


The block wrapper element needs to include `props` from `useBlockProps` to include its classes and atributes properly:
- any custom attributes (like extra classes) should be passed as an argument of `useBlockProps`
- When you add `support` for any feature, they get added to the object returned by the `useBlockProps` hook.

Like the edit function, when rendering static blocks, it’s important to add the block props returned by `useBlockProps.save()` to the wrapper element of your block. This ensures that the block class name is rendered properly in addition to any HTML attribute injected by the block supports API.

The use of `supports` generates a set of properties that need to be manually added to the wrapping element of the block so they're properly stored as part of the block data:
- in the `Edit` component via the `useBlockProps()` hook (see [example](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/edit.js#L106))
- in the `Save` component via the `useBlockProps.save()` hook (see [example](https://github.com/WordPress/block-development-examples/blob/e804d8416775de94fccae27be6f26ae0ae75b3d9/plugins/copyright-date-block-09aac3/src/save.js#L40)) 
- in any server-side render definition for the block via the `get_block_wrapper_attributes()` function (see [example](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/render.php#L31)). 


…but in order for the Gutenberg editor to know how to manipulate the block, add any extra classNames that are needed for the block… the block wrapper element should apply props retrieved from the `useBlockProps` react hook call. The block wrapper element should be a native DOM element, like <div> and <table>, or a React component that forwards any additional props to native DOM elements. Using a <Fragment> or <ServerSideRender> component, for instance, would be invalid.

If the element wrapper needs any extra custom HTML attributes, these need to be passed as an argument to the useBlockProps hook.


--- show classes generated

```
<h1 class="wp-block-myfirstblock-gtg-demo block-editor-block-list__block wp-block is-selected gtg-demo-h1" data-id="special-h1-id" id="block-f0ac2755-01e3-4e3b-9356-4af9ee46fb0d" tabindex="0" role="group" aria-label="Block: GTG Demo Block" data-block="f0ac2755-01e3-4e3b-9356-4af9ee46fb0d" data-type="myfirstblock/gtg-demo" data-title="GTG Demo Block">Hello World!</h1>
```

- My rendered h1 element in the Block Editor
- My rendered h1 element in the frontend

Related resources:
- https://franky-arkon-digital.medium.com/gutenberg-tips-generate-your-blocks-class-name-using-useblockprops-aa77a98f4fd


```html
<p 
    tabindex="0" 
    class="
        block-editor-block-list__block 
        wp-block 
        is-selected wp-block-block-development-examples-copyright-date-block-09aac3
    " 
    id="block-f68d05d7-71a3-4b8c-93f0-b673b62ed255" 
    role="document" aria-label="Block: Copyright Date Block 09aac3" data-block="f68d05d7-71a3-4b8c-93f0-b673b62ed255" data-type="block-development-examples/copyright-date-block-09aac3" data-title="Copyright Date Block 09aac3"
>
© 2020–2023
</p>
```

```html
<p class="wp-block-block-development-examples-copyright-date-block-09aac3">© 2020–2023</p>
```
