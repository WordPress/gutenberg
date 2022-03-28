# Metadata

Starting in WordPress 5.8 release, we encourage using the `block.json` metadata file as the canonical way to register block types. Here is an example `block.json` file that would define the metadata for a plugin create a notice block.

**Example:**

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json",
	"apiVersion": 2,
	"name": "my-plugin/notice",
	"title": "Notice",
	"category": "text",
	"parent": [ "core/group" ],
	"icon": "star",
	"description": "Shows warning, error or success notices…",
	"keywords": [ "alert", "message" ],
	"version": "1.0.3",
	"textdomain": "my-plugin",
	"attributes": {
		"message": {
			"type": "string",
			"source": "html",
			"selector": ".message"
		}
	},
	"providesContext": {
		"my-plugin/message": "message"
	},
	"usesContext": [ "groupId" ],
	"supports": {
		"align": true
	},
	"styles": [
		{ "name": "default", "label": "Default", "isDefault": true },
		{ "name": "other", "label": "Other" }
	],
	"example": {
		"attributes": {
			"message": "This is a notice!"
		}
	},
	"editorScript": "file:./build/index.js",
	"script": "file:./build/script.js",
	"viewScript": "file:./build/view.js",
	"editorStyle": "file:./build/index.css",
	"style": "file:./build/style.css"
}
```

## Benefits using the metadata file

The block definition allows code sharing between JavaScript, PHP, and other languages when processing block types stored as JSON, and registering blocks with the `block.json` metadata file provides multiple benefits on top of it.

From a performance perspective, when themes support lazy loading assets, blocks registered with `block.json` will have their asset enqueuing optimized out of the box. The frontend CSS and JavaScript assets listed in the `style` or `script` properties will only be enqueued when the block is present on the page, resulting in reduced page sizes.

Furthermore, because the [Block Type REST API Endpoint](https://developer.wordpress.org/rest-api/reference/block-types/) can only list blocks registered on the server, registering blocks server-side is recommended; using the `block.json` file simplifies this registration.

The [WordPress Plugins Directory](https://wordpress.org/plugins/) can detect `block.json` files, highlight blocks included in plugins, and extract their metadata. If you wish to [submit your block(s) to the Block Directory](/docs/getting-started/create-block/submitting-to-block-directory.md), all blocks contained in your plugin must have a `block.json` file for the Block Directory to recognize them.

Development is improved by using a defined schema definition file. Supported editors can provide help like tooltips, autocomplete, and schema validation. To use the schema, add the following to the top of the `block.json`.

```json
"$schema": "https://schemas.wp.org/trunk/block.json"
```

## Block registration

### PHP (server-side)

The [`register_block_type`](https://developer.wordpress.org/reference/functions/register_block_type/) function that aims to simplify the block type registration on the server, can read metadata stored in the `block.json` file.

This function takes two params relevant in this context (`$block_type` accepts more types and variants):

-   `$block_type` (`string`) – path to the folder where the `block.json` file is located or full path to the metadata file if named differently.
-   `$args` (`array`) – an optional array of block type arguments. Default value: `[]`. Any arguments may be defined. However, the one described below is supported by default:
    -   `$render_callback` (`callable`) – callback used to render blocks of this block type.

It returns the registered block type (`WP_Block_Type`) on success or `false` on failure.

**Example:**

```php
register_block_type(
	__DIR__ . '/notice',
	array(
		'render_callback' => 'render_block_core_notice',
	)
);
```

### JavaScript (client-side)

When the block is registered on the server, you only need to register the client-side settings on the client using the same block’s name.

**Example:**

```js
registerBlockType( 'my-plugin/notice', {
	edit: Edit,
	// ...other client-side settings
} );
```

Although registering the block also on the server with PHP is still recommended for the reasons above, if you want to register it only client-side you can now use `registerBlockType` method from `@wordpress/blocks` package to register a block type using the metadata loaded from `block.json` file.

The function takes two params:

-   `$blockNameOrMetadata` (`string`|`Object`) – block type name (supported previously) or the metadata object loaded from the `block.json` file with a bundler (e.g., webpack) or a custom Babel plugin.
-   `$settings` (`Object`) – client-side block settings.

It returns the registered block type (`WPBlock`) on success or `undefined` on failure.

**Example:**

```js
import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import metadata from './block.json';

registerBlockType( metadata, {
	edit: Edit,
	// ...other client-side settings
} );
```

## Block API

This section describes all the properties that can be added to the `block.json` file to define the behavior and metadata of block types.

### API Version

-   Type: `number`
-   Optional
-   Localized: No
-   Property: `apiVersion`
-   Default: `1`

```json
{ "apiVersion": 2 }
```

The version of the Block API used by the block. The most recent version is `2` and it was introduced in WordPress 5.6.

See the [the API versions documentation](/docs/reference-guides/block-api/block-api-versions.md) for more details.

### Name

-   Type: `string`
-   Required
-   Localized: No
-   Property: `name`

```json
{ "name": "core/heading" }
```

The name for a block is a unique string that identifies a block. Names have to be structured as `namespace/block-name`, where namespace is the name of your plugin or theme.

**Note:** A block name can only contain lowercase alphanumeric characters, dashes, and at most one forward slash to designate the plugin-unique namespace prefix. It must begin with a letter.

**Note:** This name is used on the comment delimiters as `<!-- wp:my-plugin/book -->`. Block types in the `core` namespace do not include a namespace when serialized.

### Title

-   Type: `string`
-   Required
-   Localized: Yes
-   Property: `title`

```json
{ "title": "Heading" }
```

This is the display title for your block, which can be translated with our translation functions. The title will display in the Inserter and in other areas of the editor.

**Note:** To keep your block titles readable and accessible in the UI, try to avoid very long titles.

### Category

-   Type: `string`
-   Optional
-   Localized: No
-   Property: `category`

```json
{ "category": "text" }
```

Blocks are grouped into categories to help users browse and discover them.

The core provided categories are:

-   text
-   media
-   design
-   widgets
-   theme
-   embed

Plugins and Themes can also register [custom block categories](/docs/reference-guides/filters/block-filters.md#managing-block-categories).

An implementation should expect and tolerate unknown categories, providing some reasonable fallback behavior (e.g. a "text" category).

### Parent

-   Type: `string[]`
-   Optional
-   Localized: No
-   Property: `parent`

```json
{ "parent": [ "my-block/product" ] }
```

Setting `parent` lets a block require that it is only available when nested within the specified blocks. For example, you might want to allow an 'Add to Cart' block to only be available within a 'Product' block.

### Icon

-   Type: `string`
-   Optional
-   Localized: No
-   Property: `icon`

```json
{ "icon": "smile" }
```

An icon property should be specified to make it easier to identify a block. These can be any of WordPress' Dashicons (slug serving also as a fallback in non-js contexts).

**Note:** It's also possible to override this property on the client-side with the source of the SVG element. In addition, this property can be defined with JavaScript as an object containing background and foreground colors. This colors will appear with the icon when they are applicable e.g.: in the inserter. Custom SVG icons are automatically wrapped in the [wp.primitives.SVG](/packages/primitives/src/svg/README.md) component to add accessibility attributes (aria-hidden, role, and focusable).

### Description

-   Type: `string`
-   Optional
-   Localized: Yes
-   Property: `description`

```json
{
	"description": "Introduce new sections and organize content to help visitors"
}
```

This is a short description for your block, which can be translated with our translation functions. This will be shown in the block inspector.

### Keywords

-   Type: `string[]`
-   Optional
-   Localized: Yes
-   Property: `keywords`
-   Default: `[]`

```json
{ "keywords": [ "keyword1", "keyword2" ] }
```

Sometimes a block could have aliases that help users discover it while searching. For example, an image block could also want to be discovered by photo. You can do so by providing an array of unlimited terms (which are translated).

### Version

-   Type: `string`
-   Optional
-   Localized: No
-   Property: `version`
-   Since: `WordPress 5.8.0`

```json
{ "version": "1.0.3" }
```

The current version number of the block, such as 1.0 or 1.0.3. It's similar to how plugins are versioned. This field might be used with block assets to control cache invalidation, and when the block author omits it, then the installed version of WordPress is used instead.

### Text Domain

-   Type: `string`
-   Optional
-   Localized: No
-   Property: `textdomain`
-   Since: `WordPress 5.7.0`

```json
{ "textdomain": "my-plugin" }
```

The [gettext](https://www.gnu.org/software/gettext/) text domain of the plugin/block. More information can be found in the [Text Domain](https://developer.wordpress.org/plugins/internationalization/how-to-internationalize-your-plugin/#text-domains) section of the [How to Internationalize your Plugin](https://developer.wordpress.org/plugins/internationalization/how-to-internationalize-your-plugin/) page.

### Attributes

-   Type: `object`
-   Optional
-   Localized: No
-   Property: `attributes`
-   Default: `{}`

```json
{
	"attributes": {
		"cover": {
			"type": "string",
			"source": "attribute",
			"selector": "img",
			"attribute": "src"
		},
		"author": {
			"type": "string",
			"source": "html",
			"selector": ".book-author"
		}
	}
}
```

Attributes provide the structured data needs of a block. They can exist in different forms when they are serialized, but they are declared together under a common interface.

See the [the attributes documentation](/docs/reference-guides/block-api/block-attributes.md) for more details.

### Provides Context

-   Type: `object`
-   Optional
-   Localized: No
-   Property: `providesContext`
-   Default: `{}`

Context provided for available access by descendants of blocks of this type, in the form of an object which maps a context name to one of the block's own attribute.

See [the block context documentation](/docs/reference-guides/block-api/block-context.md) for more details.

```json
{
	"providesContext": {
		"my-plugin/recordId": "recordId"
	}
}
```

### Context

-   Type: `string[]`
-   Optional
-   Localized: No
-   Property: `usesContext`
-   Default: `[]`

Array of the names of context values to inherit from an ancestor provider.

See [the block context documentation](/docs/reference-guides/block-api/block-context.md) for more details.

```json
{
	"usesContext": [ "message" ]
}
```

### Supports

-   Type: `object`
-   Optional
-   Localized: No
-   Property: `supports`
-   Default: `{}`

It contains as set of options to control features used in the editor. See the [the supports documentation](/docs/reference-guides/block-api/block-supports.md) for more details.

### Block Styles

-   Type: `array`
-   Optional
-   Localized: Yes (`label` only)
-   Property: `styles`
-   Default: `[]`

```json
{
	"styles": [
		{ "name": "default", "label": "Default", "isDefault": true },
		{ "name": "other", "label": "Other" }
	]
}
```

Block styles can be used to provide alternative styles to block. It works by adding a class name to the block's wrapper. Using CSS, a theme developer can target the class name for the block style if it is selected.

Plugins and Themes can also register [custom block style](/docs/reference-guides/filters/block-filters.md#block-styles) for existing blocks.

### Example

-   Type: `object`
-   Optional
-   Localized: No
-   Property: `example`

```json
{
	"example": {
		"attributes": {
			"message": "This is a notice!"
		}
	}
}
```

It provides structured example data for the block. This data is used to construct a preview for the block to be shown in the Inspector Help Panel when the user mouses over the block.

See the [the example documentation](/docs/reference-guides/block-api/block-registration.md#example-optional) for more details.

### Editor Script

-   Type: `WPDefinedAsset` ([learn more](#wpdefinedasset))
-   Optional
-   Localized: No
-   Property: `editorScript`

```json
{ "editorScript": "file:./build/index.js" }
```

Block type editor script definition. It will only be enqueued in the context of the editor.

### Script

-   Type: `WPDefinedAsset` ([learn more](#wpdefinedasset))
-   Optional
-   Localized: No
-   Property: `script`

```json
{ "script": "file:./build/script.js" }
```

Block type frontend and editor script definition. It will be enqueued both in the editor and when viewing the content on the front of the site.

### View Script

-   Type: `WPDefinedAsset` ([learn more](#wpdefinedasset))
-   Optional
-   Localized: No
-   Property: `viewScript`
-   Since: `WordPress 5.9.0`

```json
{ "viewScript": "file:./build/view.js" }
```

Block type frontend script definition. It will be enqueued only when viewing the content on the front of the site.

### Editor Style

-   Type: `WPDefinedAsset`|`WPDefinedAsset[]` ([learn more](#wpdefinedasset))
-   Optional
-   Localized: No
-   Property: `editorStyle`

```json
{ "editorStyle": "file:./build/index.css" }
```

Block type editor style definition. It will only be enqueued in the context of the editor.

_Note: An option to pass also an array of editor styles exists since WordPress `5.9.0`._

### Style

-   Type: `WPDefinedAsset`|`WPDefinedAsset[]` ([learn more](#wpdefinedasset))
-   Optional
-   Localized: No
-   Property: `style`

```json
{ "style": "file:./build/style.css" }
```

Block type frontend and editor style definition. It will be enqueued both in the editor and when viewing the content on the front of the site.

_Note: An option to pass also an array of styles exists since WordPress `5.9.0`._

## Assets

### `WPDefinedAsset`

The `WPDefinedAsset` type is a subtype of string, where the value represents a path to a JavaScript or CSS file relative to where `block.json` file is located. The path provided must be prefixed with `file:`. This approach is based on how npm handles [local paths](https://docs.npmjs.com/files/package.json#local-paths) for packages.

An alternative would be a script or style handle name referencing an already registered asset using WordPress helpers.

**Example:**

In `block.json`:

```json
{
	"editorScript": "file:./index.js",
	"script": "my-script-handle",
	"viewScript": "file:./view.js",
	"editorStyle": "my-editor-style-handle",
	"style": [ "file:./style.css", "my-style-handle" ]
}
```

In the context of WordPress, when a block is registered with PHP, it will automatically register all scripts and styles that are found in the `block.json` file and use file paths rather than asset handles.

That's why, the `WPDefinedAsset` type has to offer a way to mirror also the shape of params necessary to register scripts and styles using [`wp_register_script`](https://developer.wordpress.org/reference/functions/wp_register_script/) and [`wp_register_style`](https://developer.wordpress.org/reference/functions/wp_register_style/), and then assign these as handles associated with your block using the `script`, `style`, `editor_script`, and `editor_style` block type registration settings.

It's possible to provide an object which takes the following shape:

-   `handle` (`string`) - the name of the script. If omitted, it will be auto-generated.
-   `dependencies` (`string[]`) - an array of registered script handles this script depends on. Default value: `[]`.
-   `version` (`string`|`false`|`null`) - string specifying the script version number, if it has one, which is added to the URL as a query string for cache busting purposes. If the version is set to `false`, a version number is automatically added equal to current installed WordPress version. If set to `null`, no version is added. Default value: `false`.

The definition is stored inside separate PHP file which ends with `.asset.php` and is located next to the JS/CSS file listed in `block.json`. WordPress will automatically detect this file through pattern matching. This option is the preferred one as it is expected it will become an option to auto-generate those asset files with `@wordpress/scripts` package.

**Example:**

```
block.json
build/
├─ index.js
└─ index.asset.php
```

In `block.json`:

```json
{ "editorScript": "file:./build/index.js" }
```

In `build/index.asset.php`:

```php
<?php
return array(
	'dependencies' => array(
		'wp-blocks',
		'wp-element',
		'wp-i18n',
	),
	'version'      => '3be55b05081a63d8f9d0ecb466c42cfd',
);
```

### Frontend Enqueueing

Starting in the WordPress 5.8 release, it is possible to instruct WordPress to enqueue scripts and styles for a block type only when rendered on the frontend. It applies to the following asset fields in the `block.json` file:

-   `script`
-   `viewScript` (when the block defines `render_callback` during registration in PHP, then the block author is responsible for enqueuing the script)
-   `style`

## Internationalization

WordPress string discovery system can automatically translate fields marked in this document as translatable. First, you need to set the `textdomain` property in the `block.json` file that provides block metadata.

**Example:**

```json
{
	"title": "My block",
	"description": "My block is fantastic",
	"keywords": [ "fantastic" ],
	"textdomain": "my-plugin"
}
```

### PHP

In PHP, localized properties will be automatically wrapped in `_x` function calls on the backend of WordPress when executing `register_block_type`. These translations get added as an inline script to the plugin's script handle or to the `wp-block-library` script handle in WordPress core.

The way `register_block_type` processes translatable values is roughly equivalent to the following code snippet:

```php
<?php
$metadata = array(
	'title'       => _x( 'My block', 'block title', 'my-plugin' ),
	'description' => _x( 'My block is fantastic!', 'block description', 'my-plugin' ),
	'keywords'    => array( _x( 'fantastic', 'block keyword', 'my-plugin' ) ),
);
```

Implementation follows the existing [get_plugin_data](https://codex.wordpress.org/Function_Reference/get_plugin_data) function which parses the plugin contents to retrieve the plugin’s metadata, and it applies translations dynamically.

### JavaScript

In JavaScript, you can use `registerBlockType` method from `@wordpress/blocks` package and pass the metadata object loaded from `block.json` as the first param. All localized properties get automatically wrapped in `_x` (from `@wordpress/i18n` package) function calls similar to how it works in PHP.

**Example:**

```js
import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import metadata from './block.json';

registerBlockType( metadata, {
	edit: Edit,
	// ...other client-side settings
} );
```

## Backward Compatibility

The existing registration mechanism (both server side and frontend) will continue to work, it will serve as low-level implementation detail for the `block.json` based registration.

Once all details are ready, Core Blocks will be migrated iteratively and third-party blocks will see warnings appearing in the console to encourage them to refactor the block registration API used.

The following properties are going to be supported for backward compatibility reasons on the client-side only. Some of them might be replaced with alternative APIs in the future:

-   `edit` - see the [Edit and Save](/docs/reference-guides/block-api/block-edit-save.md) documentation for more details.
-   `save` - see the [Edit and Save](/docs/reference-guides/block-api/block-edit-save.md) documentation for more details.
-   `transforms` - see the [Transforms](/docs/reference-guides/block-api/block-registration.md#transforms-optional) documentation for more details.
-   `deprecated` - see the [Deprecated Blocks](/docs/reference-guides/block-api/block-deprecation.md) documentation for more details.
-   `merge` - undocumented as of today. Its role is to handle merging multiple blocks into one.
-   `getEditWrapperProps` - undocumented as well. Its role is to inject additional props to the block edit's component wrapper.

**Example**:

```js
import { registerBlockType } from '@wordpress/blocks';

registerBlockType( 'my-plugin/block-name', {
	edit: function () {
		// Edit definition goes here.
	},
	save: function () {
		// Save definition goes here.
	},
	getEditWrapperProps: function () {
		// Implementation goes here.
	},
} );
```

In the case of [dynamic blocks](/docs/how-to-guides/block-tutorial/creating-dynamic-blocks.md) supported by WordPress, it should be still possible to register `render_callback` property using both [`register_block_type`](https://developer.wordpress.org/reference/functions/register_block_type/) function on the server.
