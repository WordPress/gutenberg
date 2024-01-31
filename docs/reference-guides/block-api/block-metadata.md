# Metadata in block.json

Starting in WordPress 5.8 release, we recommend using the `block.json` metadata file as the canonical way to register block types with both PHP (server-side) and JavaScript (client-side). Here is an example `block.json` file that would define the metadata for a plugin create a notice block.

**Example:**

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json",
	"apiVersion": 3,
	"name": "my-plugin/notice",
	"title": "Notice",
	"category": "text",
	"parent": [ "core/group" ],
	"icon": "star",
	"description": "Shows warning, error or success notices...",
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
	"selectors": {
		"root": ".wp-block-my-plugin-notice"
	},
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
	"variations": [
		{
			"name": "example",
			"title": "Example",
			"attributes": {
				"message": "This is an example!"
			}
		}
	],
	"editorScript": "file:./index.js",
	"script": "file:./script.js",
	"viewScript": [ "file:./view.js", "example-shared-view-script" ],
	"editorStyle": "file:./index.css",
	"style": [ "file:./style.css", "example-shared-style" ],
	"viewStyle": [ "file:./view.css", "example-view-style" ],
	"render": "file:./render.php"
}
```

## Benefits of using the metadata file

The block definition allows code sharing between JavaScript, PHP, and other languages when processing block types stored as JSON, and registering blocks with the `block.json` metadata file provides multiple benefits on top of it.

From a performance perspective, when themes support lazy loading assets, blocks registered with `block.json` will have their asset enqueuing optimized out of the box. The frontend CSS and JavaScript assets listed in the `style` or `script` properties will only be enqueued when the block is present on the page, resulting in reduced page sizes.

Furthermore, because the [Block Type REST API Endpoint](https://developer.wordpress.org/rest-api/reference/block-types/) can only list blocks registered on the server, registering blocks server-side is recommended; using the `block.json` file simplifies this registration.

The [WordPress Plugins Directory](https://wordpress.org/plugins/) can detect `block.json` files, highlight blocks included in plugins, and extract their metadata. If you wish to [submit your block(s) to the Block Directory](/docs/getting-started/create-block/submitting-to-block-directory.md), all blocks contained in your plugin must have a `block.json` file for the Block Directory to recognize them.

Development is improved by using a defined schema definition file. Supported editors can provide help like tooltips, autocomplete, and schema validation. To use the schema, add the following to the top of the `block.json`.

```json
"$schema": "https://schemas.wp.org/trunk/block.json"
```

<div class="callout callout-info">
Check <a href="https://developer.wordpress.org/block-editor/getting-started/fundamentals-block-development/registration-of-a-block">Registration of a block</a> to learn more about how to register a block using its metadata.
</div>

## Block API

This section describes all the properties that can be added to the `block.json` file to define the behavior and metadata of block types.

### API version

-   Type: `number`
-   Optional
-   Localized: No
-   Property: `apiVersion`
-   Default: `1`

```json
{ "apiVersion": 3 }
```

The version of the Block API used by the block. The most recent version is `3` and it was introduced in WordPress 6.3.

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

### Ancestor

-   Type: `string[]`
-   Optional
-   Localized: No
-   Property: `ancestor`
-   Since: `WordPress 6.0.0`

```json
{ "ancestor": [ "my-block/product" ] }
```

The `ancestor` property makes a block available inside the specified block types at any position of the ancestor block subtree. That allows, for example, to place a ‘Comment Content’ block inside a ‘Column’ block, as long as ‘Column’ is somewhere within a ‘Comment Template’ block. In comparison to the `parent` property blocks that specify their `ancestor` can be placed anywhere in the subtree whilst blocks with a specified `parent` need to be direct children.

### Allowed Blocks

-   Type: `string[]`
-   Optional
-   Localized: No
-   Property: `allowedBlocks`
-   Since: `WordPress 6.5.0`

```json
{ "allowedBlocks": [ "my-block/product" ] }
```

The `allowedBlocks` specifies which block types can be the direct children of the block. For example, a ‘List’ block can allow only ‘List Item’ blocks as children.

### Icon

-   Type: `string`
-   Optional
-   Localized: No
-   Property: `icon`

```json
{ "icon": "smile" }
```

An icon property should be specified to make it easier to identify a block. These can be any of [WordPress' Dashicons](https://developer.wordpress.org/resource/dashicons/) (slug serving also as a fallback in non-js contexts).

**Note:** It's also possible to override this property on the client-side with the source of the SVG element. In addition, this property can be defined with JavaScript as an object containing background and foreground colors. This colors will appear with the icon when they are applicable e.g.: in the inserter. Custom SVG icons are automatically wrapped in the [wp.primitives.SVG](/packages/primitives/README.md) component to add accessibility attributes (aria-hidden, role, and focusable).

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

### Selectors

-   Type: `object`
-   Optional
-   Localized: No
-   Property: `selectors`
-   Default: `{}`
-   Since: `WordPress 6.3.0`

Any custom CSS selectors, keyed by `root`, feature, or sub-feature, to be used
when generating block styles for theme.json (global styles) stylesheets.
Providing custom selectors allows more fine grained control over which styles
apply to what block elements, e.g. applying typography styles only to an inner
heading while colors are still applied on the outer block wrapper etc.

See the [the selectors documentation](/docs/reference-guides/block-api/block-selectors.md) for more details.

```json
{
	"selectors": {
		"root": ".my-custom-block-selector",
		"color": {
			"text": ".my-custom-block-selector p"
		},
		"typography": {
			"root": ".my-custom-block-selector > h2",
			"text-decoration": ".my-custom-block-selector > h2 span"
		}
	}
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

Plugins and Themes can also register [custom block style](/docs/reference-guides/block-api/block-styles.md) for existing blocks.

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

See the [Example documentation](/docs/reference-guides/block-api/block-registration.md#example-optional) for more details.

### Variations

-   Type: `object[]`
-   Optional
-   Localized: Yes (`title`, `description`, and `keywords` of each variation only)
-   Property: `variations`
-   Since: `WordPress 5.9.0`

```json
{
	"variations": [
		{
			"name": "example",
			"title": "Example",
			"attributes": {
				"level": 2,
				"message": "This is an example!"
			},
			"scope": [ "block" ],
			"isActive": [ "level" ]
		}
	]
}
```

Block Variations is the API that allows a block to have similar versions of it, but all these versions share some common functionality. Each block variation is differentiated from the others by setting some initial attributes or inner blocks. Then at the time when a block is inserted these attributes and/or inner blocks are applied.

_Note: In JavaScript you can provide a function for the `isActive` property, and a React element for the `icon`. In the `block.json` file both only support strings_

See the [the variations documentation](/docs/reference-guides/block-api/block-variations.md) for more details.

### Block Hooks

-   Type: `object`
-   Optional
-   Property: `blockHooks`
-   Since: `WordPress 6.4.0`

```json
{
	"blockHooks": {
		"my-plugin/banner": "after"
	}
}
```

Block Hooks is an API that allows a block to automatically insert itself next to all instances of a given block type, in a relative position also specified by the "hooked" block. That is, a block can opt to be inserted before or after a given block type, or as its first or last child (i.e. to be prepended or appended to the list of its child blocks, respectively). Hooked blocks will appear both on the frontend and in the editor (to allow for customization by the user).

The key is the name of the block (`string`) to hook into, and the value is the position to hook into (`string`). Take a look at the [Block Hooks documentation](/docs/reference-guides/block-api/block-registration.md#block-hooks-optional) for more info about available configurations.

### Editor script

-   Type: `WPDefinedAsset`|`WPDefinedAsset[]` ([learn more](#wpdefinedasset))
-   Optional
-   Localized: No
-   Property: `editorScript`

```json
{ "editorScript": "file:./index.js" }
```

Block type editor scripts definition. They will only be enqueued in the context of the editor.

It's possible to pass a script handle registered with the [`wp_register_script`](https://developer.wordpress.org/reference/functions/wp_register_script/) function, a path to a JavaScript file relative to the `block.json` file, or a list with a mix of both ([learn more](#wpdefinedasset)).

_Note: An option to pass also an array of editor scripts exists since WordPress `6.1.0`._

### Script

-   Type: `WPDefinedAsset`|`WPDefinedAsset[]` ([learn more](#wpdefinedasset))
-   Optional
-   Localized: No
-   Property: `script`

```json
{ "script": "file:./script.js" }
```

Block type frontend and editor scripts definition. They will be enqueued both in the editor and when viewing the content on the front of the site.

It's possible to pass a script handle registered with the [`wp_register_script`](https://developer.wordpress.org/reference/functions/wp_register_script/) function, a path to a JavaScript file relative to the `block.json` file, or a list with a mix of both ([learn more](#wpdefinedasset)).

_Note: An option to pass also an array of scripts exists since WordPress `6.1.0`._

### View script

-   Type: `WPDefinedAsset`|`WPDefinedAsset[]` ([learn more](#wpdefinedasset))
-   Optional
-   Localized: No
-   Property: `viewScript`
-   Since: `WordPress 5.9.0`

```json
{ "viewScript": [ "file:./view.js", "example-shared-view-script" ] }
```

Block type frontend scripts definition. They will be enqueued only when viewing the content on the front of the site.

It's possible to pass a script handle registered with the [`wp_register_script`](https://developer.wordpress.org/reference/functions/wp_register_script/) function, a path to a JavaScript file relative to the `block.json` file, or a list with a mix of both ([learn more](#wpdefinedasset)).

_Note: An option to pass also an array of view scripts exists since WordPress `6.1.0`._

### Editor style

-   Type: `WPDefinedAsset`|`WPDefinedAsset[]` ([learn more](#wpdefinedasset))
-   Optional
-   Localized: No
-   Property: `editorStyle`

```json
{ "editorStyle": "file:./index.css" }
```

Block type editor styles definition. They will only be enqueued in the context of the editor.

It's possible to pass a style handle registered with the [`wp_register_style`](https://developer.wordpress.org/reference/functions/wp_register_style/) function, a path to a CSS file relative to the `block.json` file, or a list with a mix of both ([learn more](#wpdefinedasset)).

_Note: An option to pass also an array of editor styles exists since WordPress `5.9.0`._

### Style

-   Type: `WPDefinedAsset`|`WPDefinedAsset[]` ([learn more](#wpdefinedasset))
-   Optional
-   Localized: No
-   Property: `style`

```json
{ "style": [ "file:./style.css", "example-shared-style" ] }
```

Block type frontend and editor styles definition. They will be enqueued both in the editor and when viewing the content on the front of the site.

It's possible to pass a style handle registered with the [`wp_register_style`](https://developer.wordpress.org/reference/functions/wp_register_style/) function, a path to a CSS file relative to the `block.json` file, or a list with a mix of both ([learn more](#wpdefinedasset)).

_Note: An option to pass also an array of styles exists since WordPress `5.9.0`._

### View Style

-   Type: `WPDefinedAsset`|`WPDefinedAsset[]` ([learn more](#wpdefinedasset))
-   Optional
-   Localized: No
-   Property: `viewStyle`
-   Since: `WordPress 6.5.0`

```json
{ "viewStyle": [ "file:./view.css", "example-view-style" ] }
```

Block type frontend styles definition. They will be enqueued only when viewing the content on the front of the site.

It's possible to pass a style handle registered with the [`wp_register_style`](https://developer.wordpress.org/reference/functions/wp_register_style/) function, a path to a CSS file relative to the `block.json` file, or a list with a mix of both ([learn more](#wpdefinedasset)).

Frontend-only styles are especially useful for interactive blocks, to style parts that will only be visible after a user performs some action and where those styles will never be needed in the editor. You can start with using the `style` property to put all your common styles in one stylesheet. Only when you need editor-specific styling or frontend-specific styling, you can expand to `editorStyle` and `viewStyle`, but still keep the common part of your styling in the main stylesheet.

### Render

-   Type: `WPDefinedPath` ([learn more](#wpdefinedpath))
-   Optional
-   Localized: No
-   Property: `render`
-   Since: `WordPress 6.1.0`

```json
{ "render": "file:./render.php" }
```

PHP file to use when rendering the block type on the server to show on the front end. The following variables are exposed to the file:

-   `$attributes` (`array`): The block attributes.
-   `$content` (`string`): The block default content.
-   `$block` (`WP_Block`): The block instance.

An example implementation of the `render.php` file defined with `render` could look like:

```php
<div <?php echo get_block_wrapper_attributes(); ?>>
	<?php echo esc_html( $attributes['label'] ); ?>
</div>
```

_Note: This file loads for every instance of the block type when rendering the page HTML on the server. Accounting for that is essential when declaring functions or classes in the file. The simplest way to avoid the risk of errors is to consume that shared logic from another file._

## Assets

### `WPDefinedPath`

The `WPDefinedPath` type is a subtype of string, where the value represents a path to a JavaScript, CSS or PHP file relative to where `block.json` file is located. The path provided must be prefixed with `file:`. This approach is based on how npm handles [local paths](https://docs.npmjs.com/files/package.json#local-paths) for packages.

**Example:**

In `block.json`:

```json
{
	"render": "file:./render.php"
}
```

### `WPDefinedAsset`

It extends `WPDefinedPath` for JavaScript and CSS files. An alternative to the file path would be a script or style handle name referencing an already registered asset using WordPress helpers.

**Example:**

In `block.json`:

```json
{
	"editorScript": "file:./index.js",
	"script": "file:./script.js",
	"viewScript": [ "file:./view.js", "example-shared-view-script" ],
	"editorStyle": "file:./index.css",
	"style": [ "file:./style.css", "example-shared-style" ],
	"viewStyle": [ "file:./view.css", "example-view-style" ]
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
build/
├─ block.json
├─ index.js
└─ index.asset.php
```

In `block.json`:

```json
{ "editorScript": "file:./index.js" }
```

In `build/index.asset.php`:

```php
<?php
return array(
	'dependencies' => array(
		'react',
		'wp-blocks',
		'wp-i18n',
	),
	'version'      => '3be55b05081a63d8f9d0ecb466c42cfd',
);
```

### Frontend enqueueing

Starting in the WordPress 5.8 release, it is possible to instruct WordPress to enqueue scripts and styles for a block type only when rendered on the frontend. It applies to the following asset fields in the `block.json` file:

-   `script`
-   `viewScript`
-   `style`
-   `viewStyle` (Added in WordPress 6.5.0)

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

## Backward compatibility

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
