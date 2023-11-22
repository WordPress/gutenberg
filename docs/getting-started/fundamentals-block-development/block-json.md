# `block.json`

The `block.json` file simplifies the processs of defining a block and using the same block's definition to register the block in both the server and the client.

[![Open block.json diagram in excalidraw](https://developer.wordpress.org/files/2023/11/block-json.png)](https://excalidraw.com/#json=v1GrIkGsYGKv8P14irBy6,Yy0vl8q7DTTL2VsH5Ww27A "Open block.json diagram in excalidraw")

<div class="callout callout-tip">
Click <a href="https://github.com/WordPress/block-development-examples/tree/trunk/plugins/block-supports-6aa4dd">here</a> to see a full block example and check <a href="https://github.com/WordPress/block-development-examples/blob/trunk/plugins/block-supports-6aa4dd/src/block.json">its <code>block.json</code></a>
</div>

Besides simplifying a block's registration, using a `block.json` has [several benefits](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#benefits-using-the-metadata-file), including improved performance and development.

At [**Metadata in block.json**](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#benefits-using-the-metadata-file) you can find a detailed explanation of all the properties you can set in a `block.json` for a block. With these properties you can define things such as:

- Basic metadata of the block
- Files for the block's behavior, style, or output
- Data Storage in the Block
- Setting UI panels for the block

## Basic metadata of the block

Through properties of the `block.json`, we can define how the block will be uniquely idenfified, how it can be found, and the info displayed for the block in the Block Editor. Some of these properties are:

- `apiVersion`: the version of [the API](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-api-versions/) used by the block (current version is 2)
- `name`:  a unique identifier for a block including a namespace
- `title`:  a display title for a block
- `category`:  a block category for the block in the Inserter panel
- `icon`:  a [Dashicon](https://developer.wordpress.org/resource/dashicons) slug or a custom SVG icon
- `description`:  a short description visible in the block inspector
- `keywords`: to locate the block in the inserter
- `textdomain`: the plugin text-domain (important for things such as translations)

## Files for the block's behavior, output, or style 

The `editorScript` and `editorStyle` properties allow defining Javascript and CSS files to be enqueued and loaded **only in the editor**.

The `script` and `style` properties allow the definition of Javascript and CSS files to be enqueued and loaded **in both the editor and the front end**.

The `viewScript` property allow us to define the Javascript file or files to be enqueued and loaded **only in the front end**.

All these properties (`editorScript`, `editorStyle`, `script` `style`,`viewScript`) accept as a value a path for the file, a handle registered with `wp_register_script` or `wp_register_style`, or an array with a mix of both. Paths values in `block.json` are prefixed with `file:`.

The `render` property ([introduced on WordPress 6.1](https://make.wordpress.org/core/2022/10/12/block-api-changes-in-wordpress-6-1/)) sets the path of a `.php` template file that will render the markup returned to the front end. This only method will be used to return the markup for the block on request only if `$render_callback` function has not been passed to the `register_block_type` function.

## Data Storage in the Block with `attributes`

The [`attributes` property](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/) allows a block to declare variables that store data or content for the block.

_Example: Atributes as defined in block.json_
```json
"attributes": {
	"fallbackCurrentYear": {
		"type": "string"
	},
	"showStartingYear": {
		"type": "boolean"
	},
	"startingYear": {
		"type": "string"
	}
},
```

[![Open Attributes diagram in excalidraw](https://developer.wordpress.org/files/2023/11/attributes.png)](https://excalidraw.com/#json=pSgCZy8q9GbH7r0oz2fL1,MFCLd6ddQHqi_UqNp5ZSgg "Open Attributes diagram in excalidraw")

<div class="callout callout-info">
Check the <a href="https://developer.wordpress.org/redesign-test/block-editor/reference-guides/block-api/block-attributes/"> <code>attributes</code> </a> reference page for full info about the Attributes API. 
</div>

By default `attributes` are serialized and stored in the block's delimiter but this [can be configured](https://developer.wordpress.org/news/2023/09/understanding-block-attributes/).

_Example: Atributes stored in the Markup representation of the block_
```html
<!-- wp:block-development-examples/copyright-date-block-09aac3 {"fallbackCurrentYear":"2023","showStartingYear":true,"startingYear":"2020"} -->
<p class="wp-block-block-development-examples-copyright-date-block-09aac3">© 2020–2023</p>
<!-- /wp:block-development-examples/copyright-date-block-09aac3 -->x
```

These attributes are passed to the React components `Edit`(to display in the Block Editor) and `Save` (to return the markup saved to the DB) of the block, and to any server-side render definition for the block (see `render` prop above). 

The `Edit` component receives exclusively the capability of updating the attributes via the `setAttributes` function.

_See how the attributes are passed to the [`Edit` component](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/edit.js), [the `Save` component](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/save.js) and [the `render.php`](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/render.php) in this [full block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/copyright-date-block-09aac3) of the  code above_

<div class="callout callout-info">
Check the <a href="https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/"> <code>attributes</code> </a> reference page for full info about the Supports API. 
</div>

## Enable UI settings panels for the block with `supports`

The `supports` property allows a block to declare support for certain features, enabling users to customize specific settings (like colors or margins) from the Settings Sidebar.

_Example: Supports as defined in block.json_

```json
"supports": {
	"color": {
		"text": true,
		"link": true,
		"background": true
	}
}
```

The use of `supports` generates a set of properties that need to be manually added to the wrapping element of the block so they're properly stored as part of the block data:
- in the `Edit` component via the `useBlockProps()` hook (see [example](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/edit.js#L106))
- in the `Save` component via the `useBlockProps.save()` hook (see [example](https://github.com/WordPress/block-development-examples/blob/e804d8416775de94fccae27be6f26ae0ae75b3d9/plugins/copyright-date-block-09aac3/src/save.js#L40)) 
- in any server-side render definition for the block via the `get_block_wrapper_attributes()` function (see [example](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/render.php#L31)). 

_Example: Supports custom settings stored in the Markup representation of the block_

```html
<!-- wp:block-development-examples/block-supports-6aa4dd {"style":{"elements":{"link":{"color":{"text":"var:preset|color|contrast"}}}},"backgroundColor":"accent-3","textColor":"contrast"} -->
<p class="wp-block-block-development-examples-block-supports-6aa4dd has-contrast-color has-accent-3-background-color has-text-color has-background has-link-color">Hello World!</p>
<!-- /wp:block-development-examples/block-supports-6aa4dd -->
```

_See the [full block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/block-supports-6aa4dd) of the  [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/block-supports-6aa4dd/src/block.json)_

<div class="callout callout-info">
Check the <a href="https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/"> <code>supports</code> </a> reference page for full info about the Supports API. 
</div>
