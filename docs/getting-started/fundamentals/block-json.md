# block.json

The `block.json` file simplifies the process of defining and registering a block by using the same block's definition in JSON format to register the block on both the server and the client (Block Editor).

The diagram below details the basic structure of the `block.json` file.

[![Open block.json diagram image](https://developer.wordpress.org/files/2023/11/block-json.png)](https://developer.wordpress.org/files/2023/11/block-json.png "Open block.json diagram image")

<div class="callout callout-info">
	To view a complete block example and its associated <a href="https://github.com/WordPress/block-development-examples/blob/trunk/plugins/block-supports-6aa4dd/src/block.json"><code>block.json</code></a> file, visit the <a href="https://github.com/WordPress/block-development-examples/tree/trunk/plugins/block-supports-6aa4dd">Block Development Examples</a> GitHub repository.
</div>

Besides simplifying a block's registration, using a `block.json` has [several benefits](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#benefits-using-the-metadata-file), including improved performance.

The [Metadata in block.json](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/) documentation has a comprehensive guide on all the properties you can use in a `block.json` file for a block. This article will cover the most common options, which allow you to specify:

- The block's basic metadata.
- The files that dictate the block's functionality, appearance, and output.
- How data is stored within the block.
- The block's setting panels within the user interface.

## Basic metadata of a block

Using `block.json` properties, you can define how the block will be uniquely identified and what information is displayed in the Block Editor. These properties include:

- **[`apiVersion`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#api-version):** Specifies the [API](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-api-versions/) version the block uses. Use the latest version unless you have specific requirements.
- **[`name`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#name):**  The unique name of the block, including namespace (e.g., `my-plugin/my-custom-block`).
- **[`title`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#title):** The display title for the block, shown in the Inserter.
- **[`category`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#category):** The category under which the block appears in the Inserter. Common categories include `text`, `media`, `design`, `widgets`, and `theme`.
- **[`icon`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#icon):**  An icon representing the block in the Inserter. This can be a [Dashicon](https://developer.wordpress.org/resource/dashicons) slug or a custom SVG icon.
- **[`description`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#description):**  A short description of the block, providing more context than the title.
- **[`keywords`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#keywords):** An array of keywords to help users find the block when searching.
- **[`textdomain`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#text-domain):** The text domain for the block, used for internationalization.

## Files for the block's behavior, output, or style 

The `block.json` file also allows you to specify the essential files for a block's functionality:

- **[`editorScript`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#editor-script):** A JavaScript file or files for use only in the Block Editor.
- **[`editorStyle`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#editor-style):** A CSS file or files for styling within the Block Editor.
- **[`script`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#script):** A JavaScript file or files loaded in both the Block Editor and the front end.
- **[`style`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#style):** A CSS file or files applied in both the Block Editor and the front end.
- **[`viewScript`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script):** A JavaScript file or files intended solely for the front end.

For all these properties, you can provide a [file path](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#wpdefinedpath) (starting with `file:`), a [handle](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#wpdefinedasset) that has been registered using `wp_register_script` or `wp_register_style`, or an array combining both options.

Additionally, the [`render`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#render) property, [introduced on WordPress 6.1](https://make.wordpress.org/core/2022/10/12/block-api-changes-in-wordpress-6-1/), specifies the path to a PHP template file responsible for generating a [dynamically rendered](/docs/getting-started/fundamentals/static-dynamic-rendering.md) block's front-end markup. This approach is used if a `$render_callback` function is not provided to the `register_block_type()` function.

## Using block `attributes` to store data

Block [attributes](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#attributes) are settings or data assigned to blocks. They can determine various aspects of a block, such as its content, layout, style, and any other specific information you need to store along with your block's structure. If the user changes a block, such as modifying the font size, you need a way to persist these changes. Attributes are the solution. 

When registering a new block type, the `attributes` property of `block.json` describes the custom data the block requires and how they're stored in the database. This allows the Block Editor to parse these values correctly and pass the `attributes` to the block's `Edit` component and `save` function.

Here's an example of three attributes defined in `block.json`:

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

Blocks are "delimited" using HTML-style comment tags that contain specific JSON-like attributes. These delimiters make it possible to recognize block boundaries and parse block attributes when rendering post content or editing a post in the Block Editor. 

The code example below demonstrates the attributes defined in the block delimiter. 

```html
<!-- wp:block-development-examples/copyright-date-block-09aac3 {"fallbackCurrentYear":"2023","showStartingYear":true,"startingYear":"2020"} -->
<p class="wp-block-block-development-examples-copyright-date-block-09aac3">© 2020–2023</p>
<!-- /wp:block-development-examples/copyright-date-block-09aac3 -->
```
 
All attributes are serialized and stored in the block's delimiter by default, but this can be configured to suit your needs. Check out the [Understanding Block Attributes](https://developer.wordpress.org/news/2023/09/understanding-block-attributes/) article to learn more.

### Reading and updating attributes 

These [attributes](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#attributes) are passed to the block's `Edit` React component for display in the Block Editor, to the `save` function for generating the markup that gets stored in the database, and to any server-side rendering definition for the block.

The `Edit` component uniquely possesses the ability to modify these attributes through the [`setAttributes`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#setattributes) function.

The following diagram details how attributes are stored, read, and updated in a typical block.

[![Open Attributes diagram image](https://developer.wordpress.org/files/2023/11/attributes.png)](https://developer.wordpress.org/files/2023/11/attributes.png "Open Attributes diagram image")

_See how the attributes are passed to the [`Edit`](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/edit.js) component, the [`save`](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/save.js) function, and [`render.php`](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/copyright-date-block-09aac3/src/render.php) in this [complete block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/copyright-date-block-09aac3)._

For more information about attributes and how to use them in your custom blocks, visit the [Attributes API](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/) reference page. 

## Using block supports to enable settings and styles

Many blocks, including Core blocks, offer similar customization options, such as background color, text color, and padding adjustments.

The [`supports`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#supports) property in `block.json` allows a block to declare support for a set of these common customization options. When enabled, users of the block can then adjust things like color or padding directly from the Settings Sidebar.

Leveraging these predefined block supports helps ensure your block behaves consistently with Core blocks, eliminating the need to recreate similar functionalities from scratch.

Here's an example of color supports defined in `block.json`:

```json
"supports": {
	"color": {
		"text": true,
		"link": true,
		"background": true
	}
}
```

The use of block supports generates a set of properties that need to be manually added to the [wrapping element of the block](https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-wrapper/). This ensures they're properly stored as part of the block data and taken into account when generating the markup of the block that will be delivered to the front end.

The following code demonstrates how the attributes and CSS classes generated by enabling block supports are stored in the markup representation of the block.

```html
<!-- wp:block-development-examples/block-supports-6aa4dd {"backgroundColor":"contrast","textColor":"accent-4"} -->
<p class="wp-block-block-development-examples-block-supports-6aa4dd has-accent-4-color has-contrast-background-color has-text-color has-background">Hello World</p>
<!-- /wp:block-development-examples/block-supports-6aa4dd -->
```

_See the [complete block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/block-supports-6aa4dd) of the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/block-supports-6aa4dd/src/block.json)._

For more information about supports and how to use them in your custom blocks, visit the [Supports API](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/) reference page. 


## Additional resources

- [block.json diagram](https://excalidraw.com/#json=v1GrIkGsYGKv8P14irBy6,Yy0vl8q7DTTL2VsH5Ww27A)
- [Attributes diagram](https://excalidraw.com/#json=pSgCZy8q9GbH7r0oz2fL1,MFCLd6ddQHqi_UqNp5ZSgg)