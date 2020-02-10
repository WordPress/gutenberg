# Block Type Registration RFC

This RFC is intended to serve both as a specification and as documentation for the implementation of runtime-agnostic block type registration.

## Requirements

Behind any block type registration is some abstract concept of a unit of content. This content type can be described without consideration of any particular technology. In much the same way, we should be able to describe the core constructs of a block type in a way which can be interpreted in any runtime.

In more practical terms, an implementation should fulfill requirements that...

* A block type registration should be declarative and context-agnostic. Any runtime (PHP, JS, or other) should be able to interpret the basics of a block type (see "Block API" in the sections below) and should be able to fetch or retrieve the definitions of the context-specific implementation details. The following things should be made possible:
  * Fetching the available block types through REST APIs.
  * Fetching block objects from posts through REST APIs.
* This API should be backward compatible with what we have at the moment.
* It should be possible to statically analyze a block type in order to support advanced use-cases required by one of the [9 projects](https://make.wordpress.org/core/2018/12/08/9-priorities-for-2019/) for 2019 in WordPress: "Building a WordPress.org directory for discovering blocks, and a way to seamlessly install them.". The block directory should not need to parse JavaScript or PHP files to retrieve their definitions similar to how it happens for plugins as of today.

It can statically analyze the files of any plugin to retrieve blocks and their properties.
* It should not require a build tool compilation step (e.g. Babel, Webpack) to author code which would be referenced in a block type definition.
* There should allow the potential to dynamically load ("lazy-load") block types, or parts of block type definitions. It practical terms, it means that the editor should be able to be loaded without enqueuing all the assets (scripts and styles) of all block types. What it needs is the basic metadata (`title`, `description`, `category`, `icon`, etc...) to start with. It should be fine to defer loading all other code (`edit`, `save`, `transforms`, and other JavaScript implementations) until it is explicitly used (inserted into the post content).

## References

* Issue: [Block API: Server-side awareness of block types](https://github.com/WordPress/gutenberg/issues/2751)
* Follow-up issue: [Expose available blocks via an API](https://github.com/WordPress/gutenberg/issues/4116)
* Current documentation: [/docs/designers-developers/developers/block-api/block-registration.md](/docs/designers-developers/developers/block-api/block-registration.md)
* Make WordPress.org post: [The Block Directory, and a new type of plugin](https://make.wordpress.org/meta/2019/03/08/the-block-directory-and-a-new-type-of-plugin/)


## Previous attempts

Initial support for server-defined block attributes was merged as part of [#2529](https://github.com/WordPress/gutenberg/pull/2529). PHP block type registrations are merged with those defined in the JavaScript runtime. While this enabled blocks to be defined within PHP, the majority of block types continue to be defined within JavaScript alone. The support was reserved for the exclusive use of [dynamic block types](/docs/designers-developers/developers/tutorials/block-tutorial/creating-dynamic-blocks.md), in large part because [`edit` and `save` behaviors](/docs/designers-developers/developers/block-api/block-edit-save.md) must still be implemented in JavaScript, and because a solution hadn't been considered for how to create individual block bundles during the build process, nor how to load such bundles efficiently if it were to come to be implemented.

A demonstration for how block registration could be made filterable in PHP was explored in [#5802](https://github.com/WordPress/gutenberg/pull/5802). The purpose here was to explore how plugins could have better control over the registration.

Another exploration in [#5652](https://github.com/WordPress/gutenberg/pull/5652) considered using JSON as a file format to share block type definitions between JavaScript and PHP. 

### Conclusions

* The current approaches to client-side block type registration cannot support the proposed requirement to have all block types known outside the browser context.
* Using a statically-defined, JSON-formatted block type definition enables easy integration in both JavaScript and PHP runtimes.
* Registering a block type in PHP would allow for attribute default values to be assigned as dynamically generated from some external state (e.g. a database value, or localized string).
* By default, JSON does not support localization or dynamic values.
* On the server, a block type `icon` property can only be assigned as a string and thus cannot support SVGs and component-based icons.

---

## Introduction

Blocks are the fundamental elements of the editor. They are the primary way in which plugins and themes can register their own functionality and extend the capabilities of the editor.

## Registering a block type

To register a new block type, start by creating a `block.json` file. This file:

* Gives a name to the block type.
* Defines some important metadata about the registered block type (title, category, icon, description, keywords).
* Defines the attributes of the block type.
* Registers all the scripts and styles for your block type.

**Example:**


```json
{
	"name": "my-plugin/notice",
	"title": "Notice",
	"category": "common",
	"parent": [ "core/group" ],
	"icon": "star",
	"description": "Shows warning, error or success notices  ...",
	"keywords": [ "alert", "message" ],
	"textDomain": "my-plugin",
	"attributes": {
		"message": {
			"type": "string",
			"source": "html",
			"selector": ".message"
		}
	},
	"styleVariations": [ 
		{ "name": "default", "label": "Default", "isDefault": true }, 
		{ "name": "other", "label": "Other" }
	],
	"editorScript": "build/editor.js",
	"script": "build/main.js",
	"editorStyle": "build/editor.css",
	"style": "build/style.css"
}
```

## Block API

This section describes all the properties that can be added to the `block.json` file to define the behavior and metadata of block types.

### Name

* Type: `string`
* Required
* Localized: No
* Property: `name`

```json
{ "name": "core/heading" }
```

The name for a block is a unique string that identifies a block. Names have to be structured as `namespace/block-name`, where namespace is the name of your plugin or theme.

**Note:** A block name can only contain lowercase alphanumeric characters, dashes, and at most one forward slash to designate the plugin-unique namespace prefix. It must begin with a letter.

**Note:** This name is used on the comment delimiters as `<!-- wp:my-plugin/book -->`. Block types in the `core` namespace do not include a namespace when serialized.

### Title

* Type: `string`
* Required
* Localized: Yes
* Property: `title`

```json
{ "title": "Heading" }
```

This is the display title for your block, which can be translated with our translation functions. The block inserter will show this name.

### Category

* Type: `string`
* Required
* Localized: No
* Property: `category`

```json
{ "category": "common" }
```

Blocks are grouped into categories to help users browse and discover them.

The core provided categories are:

* common
* formatting
* layout
* widgets
* embed

Plugins and Themes can also register [custom block categories](/docs/designers-developers/developers/filters/block-filters.md#managing-block-categories).

An implementation should expect and tolerate unknown categories, providing some reasonable fallback behavior (e.g. a "common" category).

### Parent

* Type: `string[]`
* Optional
* Localized: No
* Property: `parent`

```json
{ "parent": [ "my-block/product" ] }
```

Setting `parent` lets a block require that it is only available when nested within the specified blocks. For example, you might want to allow an 'Add to Cart' block to only be available within a 'Product' block.

### Icon

* Type: `string`
* Optional
* Localized: No
* Property: `icon`

```json
{ "icon": "smile" }
```

An icon property should be specified to make it easier to identify a block. These can be any of WordPress' Dashicons (slug serving also as a fallback in non-js contexts).

**Note:** It's also possible to override this property on the client-side with the source of the SVG element. In addition, this property can be defined with JavaScript as an object containing background and foreground colors. This colors will appear with the icon when they are applicable e.g.: in the inserter. Custom SVG icons are automatically wrapped in the [wp.primitives.SVG](/packages/primitives/src/svg/README.md) component to add accessibility attributes (aria-hidden, role, and focusable).

### Description

* Type: `string`
* Optional
* Localized: Yes
* Property: `description`

```json
 { "description": "Introduce new sections and organize content to help visitors" }
```

This is a short description for your block, which can be translated with our translation functions. This will be shown in the block inspector.

### Keywords

* Type: `string[]`
* Optional
* Localized: Yes
* Property: `keywords`

```json
{ "keywords": [ "keyword1", "keyword2" ] }
```

Sometimes a block could have aliases that help users discover it while searching. For example, an image block could also want to be discovered by photo. You can do so by providing an array of unlimited terms (which are translated).

### Text Domain

* Type: `string`
* Optional
* Localized: No
* Property: `textDomain`

```json
{ "textDomain": "my-plugin" }
```

The [gettext](https://www.gnu.org/software/gettext/) text domain of the plugin/block. More information can be found in the [Text Domain](https://developer.wordpress.org/plugins/internationalization/how-to-internationalize-your-plugin/#text-domains) section of the [How to Internationalize your Plugin](https://developer.wordpress.org/plugins/internationalization/how-to-internationalize-your-plugin/) page.

### Attributes

* Type: `object`
* Optional
* Localized: No
* Property: `attributes`

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

See the [the attributes documentation](/docs/designers-developers/developers/block-api/block-attributes.md) for more details.

### Style Variations

* Type: `array`
* Optional
* Localized: Yes (`label`)
* Property: `styles`
* Alias: `styleVariations`

```json
{ 
	"styleVariations": [ 
		{ "name": "default", "label": "Default", "isDefault": true }, 
		{ "name": "other", "label": "Other" }
	]
}
```

Block styles can be used to provide alternative styles to block. It works by adding a class name to the block's wrapper. Using CSS, a theme developer can target the class name for the style variation if it is selected.

Plugins and Themes can also register [custom block style](/docs/designers-developers/developers/filters/block-filters.md#block-style-variations) for existing blocks.

### Editor Script

* Type: `string` ([WPDefinedAsset](#WPDefinedAsset))
* Optional
* Localized: No
* Property: `editorScript`

```json
{ "editorScript": "build/editor.js" }
```

Block type editor script definition. It will only be enqueued in the context of the editor.

### Script

* Type: `string` ([WPDefinedAsset](#WPDefinedAsset))
* Optional
* Localized: No
* Property: `script`

```json
{ "script": "build/main.js" }
```

Block type frontend script definition. It will be enqueued both in the editor and when viewing the content on the front of the site.

### Editor Style

* Type: `string` ([WPDefinedAsset](#WPDefinedAsset))
* Optional
* Localized: No
* Property: `editorStyle`

```json
{ "editorStyle": "build/editor.css" }
```

Block type editor style definition. It will only be enqueued in the context of the editor.

### Style

* Type: `string` ([WPDefinedAsset](#WPDefinedAsset))
* Optional
* Localized: No
* Property: `style`

```json
{ "style": "build/style.css" }
```

Block type frontend style definition. It will be enqueued both in the editor and when viewing the content on the front of the site.

## Backward compatibility

The following properties are going to be supported for backward compatibility reasons on the client-side only. Some of them might be replaced with alternative APIs in the future:
 - `edit` - see the [Edit and Save](/docs/designers-developers/developers/block-api/block-edit-save.md) documentation for more details.
 - `save` - see the [Edit and Save](/docs/designers-developers/developers/block-api/block-edit-save.md) documentation for more details.
 - `transforms` - see the [Transforms](/docs/designers-developers/developers/block-api/block-registration.md#transforms-optional) documentation for more details.
 - `deprecated` - see the [Deprecated Blocks](/docs/designers-developers/developers/block-api/block-deprecation.md) documentation for more details.
 - `supports` - see the [block supports](/docs/designers-developers/developers/block-api/block-registration.md#supports-optional) documentation page for more details.
 - `merge` - undocumented as of today. Its role is to handle merging multiple blocks into one.
 - `getEditWrapperProps` - undocumented as well. Its role is to inject additional props to the block edit's component wrapper.
 
**Example**:
```js
wp.blocks.registerBlockType( 'my-block/name', {
	edit: function() {
		// Edit definition goes here.
	},
	save: function() {
		// Save definition goes here.
	},
	supports: {
		html: false
	}
} );
``` 

In the case of [dynamic blocks](/docs/designers-developers/developers/tutorials/block-tutorial/creating-dynamic-blocks.md) supported by WordPress, it should be still possible to register `render_callback` property using [`register_block_type`](https://developer.wordpress.org/reference/functions/register_block_type/) function on the server.

## Assets

### `WPDefinedAsset`

The `WPDefinedAsset` type is a subtype of string, where the value must represent an absolute or relative path to a JavaScript or CSS file.

**Example:**

In `block.json`:
```json
{ "editorScript": "build/editor.js" }
```

#### WordPress context

In the context of WordPress, when a block is registered with PHP, it will automatically register all scripts and styles that are found in the `block.json` file.

That's why, the `WPDefinedAsset` type has to offer a way to mirror also the shape of params necessary to register scripts and styles using [`wp_register_script`](https://developer.wordpress.org/reference/functions/wp_register_script/) and [`wp_register_style`](https://developer.wordpress.org/reference/functions/wp_register_style/), and then assign these as handles associated with your block using the `script`, `style`, `editor_script`, and `editor_style` block type registration settings.

It's possible to provide an object which takes the following shape:
- `handle` (`string`) - the name of the script. If omitted, it will be auto-generated.
- `dependencies` (`string[]`) - an array of registered script handles this script depends on.  Default value: `[]`.
- `version` (`string`|`false`|`null`) - string specifying the script version number, if it has one, which is added to the URL as a query string for cache busting purposes. If the version is set to `false`, a version number is automatically added equal to current installed WordPress version. If set to `null`, no version is added. Default value: `false`.

The definition is stored inside separate JSON file which ends with `.asset.json` and is located next to the JS/CSS file listed in `block.json`. WordPress will automatically detect this file through pattern matching. This option is the preferred one as it is expected it will become an option to auto-generate those asset files with `@wordpress/scripts` package.

**Example:**

```
build/
├─ editor.js
└─ editor.asset.json
```

In `block.json`:
```json
{ "editorScript": "build/editor.js" }
```

In `build/editor.asset.json`:
```json
{
	"handle": "my-plugin-notice-editor",
	"dependencies": [ "wp-blocks","wp-element", "wp-i18n" ],
	"version": "3.0.0"
}
```

## Internationalization

Localized properties are automatically wrapped in `_x` function calls on the backend and the frontend of WordPress. These translations are added as an inline script to the `wp-block-library` script handle in WordPress core or to the plugin's script handle when it defines metadata definition.

WordPress string discovery automatically translates these strings using the `textDomain` property specified in the `block.json` file.

**Example:**

```json
{
	"title": "My block",
	"description": "My block is fantastic",
	"keywords": [ "fantastic" ],
	"textDomain": "my-plugin"
}
```

In JavaScript, with the help of a Babel plugin, this becomes:

```js
const metadata = {
	title: _x( 'My block', 'block title', 'my-plugin' ),
	description: _x( 'My block is fantastic', 'block description', 'my-plugin' ),
	keywords: [ _x( 'fantastic', 'block keywords', 'my-plugin' ) ],
}
```

In PHP, it is transformed at runtime to code roughly equivalent to:

```php
<?php
$metadata = array(
	'title'       => _x( 'My block', 'block title', 'my-plugin' ),
	'description' => _x( 'My block is fantastic!', 'block description', 'my-plugin' ),
	'keywords'    => array( _x( 'fantastic', 'block keywords', 'my-plugin' ) ),
);
```

Implementation should follow the existing [get_plugin_data](https://codex.wordpress.org/Function_Reference/get_plugin_data) function which parses the plugin contents to retrieve the plugin’s metadata, and it applies translations dynamically.

## Backward Compatibility

The existing registration mechanism (both server side and frontend) will continue to work, it will serve as low-level implementation detail for the `block.json` based registration.

Core Blocks will be migrated iteratively and third-party blocks will see warnings appearing in the console to encourage them to refactor the block registration API used.
