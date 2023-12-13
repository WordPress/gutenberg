# block.json

The `block.json` file simplifies the processs of defining and registering a block by using the same block's definition in JSON format to register the block in both the server and the client.

[![Open block.json diagram image](https://developer.wordpress.org/files/2023/11/block-json.png)](https://developer.wordpress.org/files/2023/11/block-json.png "Open block.json diagram image")

<div class="callout callout-tip">
Click <a href="https://github.com/WordPress/block-development-examples/tree/trunk/plugins/block-supports-6aa4dd">here</a> to see a full block example and check <a href="https://github.com/WordPress/block-development-examples/blob/trunk/plugins/block-supports-6aa4dd/src/block.json">its <code>block.json</code></a>
</div>

Besides simplifying a block's registration, using a `block.json` has [several benefits](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#benefits-using-the-metadata-file), including improved performance and development.

At [**Metadata in block.json**](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/) you can find a detailed explanation of all the properties you can set in a `block.json` for a block. With these properties you can define things such as:

- Basic metadata of the block
- Files for the block's behavior, style, or output
- Data Storage in the Block
- Setting UI panels for the block

## Basic metadata of the block

Through properties of the `block.json`, we can define how the block will be uniquely identified, how it can be found, and the info displayed for the block in the Block Editor. Some of these properties are:

- [`apiVersion`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#api-version): the version of [the API](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-api-versions/) used by the block (current version is 2).
- [`name`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#name):  a unique identifier for a block, including a namespace.
- [`title`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#title):  a display title for a block.
- [`category`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#category):  a block category for the block in the Inserter panel.
- [`icon`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#icon):  a [Dashicon](https://developer.wordpress.org/resource/dashicons) slug or a custom SVG icon.
- [`description`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#description):  a short description visible in the block inspector.
- [`keywords`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#keywords): to locate the block in the inserter.
- [`textdomain`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#text-domain): the plugin text-domain (important for things such as translations).

## Files for the block's behavior, output, or style 

The [`editorScript`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#editor-script) and [`editorStyle`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#editor-style) properties allow defining Javascript and CSS files to be enqueued and loaded **only in the editor**.

The [`script`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#script) and [`style`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#style) properties allow the definition of Javascript and CSS files to be enqueued and loaded **in both the editor and the front end**.

The [`viewScript`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script) property allow us to define the Javascript file or files to be enqueued and loaded **only in the front end**.

All these properties (`editorScript`, `editorStyle`, `script` `style`,`viewScript`) accept as a value a [path for the file](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#wpdefinedpath) (prefixed with `file:`), a [handle registered with `wp_register_script` or `wp_register_style`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#wpdefinedasset), or an array with a mix of both.

The [`render`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#render) property ([introduced on WordPress 6.1](https://make.wordpress.org/core/2022/10/12/block-api-changes-in-wordpress-6-1/)) sets the path of a `.php` template file that will render the markup returned to the front end. This only method will be used to return the markup for the block on request only if `$render_callback` function has not been passed to the `register_block_type` function.

## Data Storage in the Block with `attributes`

The [`attributes` property](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#attributes) allows a block to declare "variables" that store data or content for the block.

_Example: Attributes as defined in block.json_
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
By default `attributes` are serialized and stored in the block's delimiter but this [can be configured](https://developer.wordpress.org/news/2023/09/understanding-block-attributes/).

_Example: Atributes stored in the Markup representation of the block_
```html
<!-- wp:block-development-examples/copyright-date-block-09aac3 {"fallbackCurrentYear":"2023","showStartingYear":true,"startingYear":"2020"} -->
<p class="wp-block-block-development-examples-copyright-date-block-09aac3">© 2020–2023</p>
<!-- /wp:block-development-examples/copyright-date-block-09aac3 -->x
```

These [`attributes`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#attributes) are passed to the React component `Edit`(to display in the Block Editor) and the `save` function (to return the markup saved to the DB) of the block, and to any server-side render definition for the block (see `render` prop above). 

The `Edit` component receives exclusively the capability of updating the attributes via the [`setAttributes`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#setattributes) function.

_See how the attributes are passed to the [`Edit` component](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/edit.js), [the `save` function](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/save.js) and [the `render.php`](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/render.php) in this [full block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/copyright-date-block-09aac3) of the  code above_

<div class="callout callout-info">
Check the <a href="https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/"> <code>attributes</code> </a> reference page for full info about the Attributes API. 
</div>

[![Open Attributes diagram image](https://developer.wordpress.org/files/2023/11/attributes.png)](https://developer.wordpress.org/files/2023/11/attributes.png "Open Attributes diagram image")


## Enable UI settings panels for the block with `supports`

The [`supports`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#supports) property allows a block to declare support for certain features, enabling users to customize specific settings (like colors or margins) from the Settings Sidebar.

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

The use of `supports` generates a set of properties that need to be manually added to the wrapping element of the block so they're properly stored as part of the block data.

_Example: Supports custom settings stored in the Markup representation of the block_

```html
<!-- wp:block-development-examples/block-supports-6aa4dd {"backgroundColor":"contrast","textColor":"accent-4"} -->
<p class="wp-block-block-development-examples-block-supports-6aa4dd has-accent-4-color has-contrast-background-color has-text-color has-background">Hello World</p>
<!-- /wp:block-development-examples/block-supports-6aa4dd -->
```

_See the [full block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/block-supports-6aa4dd) of the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/block-supports-6aa4dd/src/block.json)_

<div class="callout callout-info">
Check the <a href="https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/"> <code>supports</code> </a> reference page for full info about the Supports API. 
</div>


## Additional resources

- [block.json diagram](https://excalidraw.com/#json=v1GrIkGsYGKv8P14irBy6,Yy0vl8q7DTTL2VsH5Ww27A)
- [Attributes diagram](https://excalidraw.com/#json=pSgCZy8q9GbH7r0oz2fL1,MFCLd6ddQHqi_UqNp5ZSgg)