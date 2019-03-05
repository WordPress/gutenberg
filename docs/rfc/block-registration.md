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
* Current documentation: [https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-registration/](https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-registration/)


## Previous attempts

Initial support for server-defined block attributes was merged as part of [#2529](https://github.com/WordPress/gutenberg/pull/2529). PHP block type registrations are merged with those defined in the JavaScript runtime. While this enabled blocks to be defined within PHP, the majority of block types continue to be defined within JavaScript alone. The support was reserved for the exclusive use of [dynamic block types](https://wordpress.org/gutenberg/handbook/designers-developers/developers/tutorials/block-tutorial/creating-dynamic-blocks/), in large part because <code>[edit and save behaviors](https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-edit-save/)</code> must still be implemented in JavaScript, and because a solution hadn't been considered for how to create individual block bundles during the build process, nor how to load such bundles efficiently if it were to come to be implemented.

A demonstration for how block registration could be made filterable in PHP was explored in [#5802](https://github.com/WordPress/gutenberg/pull/5802). The purpose here was to explore how plugins could have better control over the registration.

Another exploration in [#5652](https://github.com/WordPress/gutenberg/pull/5652) considered using JSON as a file format to share block type definitions between JavaScript and PHP. 

### Conclusions

* The current approaches to client-side block type registration cannot support the proposed requirement to have all block types known outside the browser context.
* Using a statically-defined, JSON-formatted block type definition enables easy integration in both JavaScript and PHP runtimes.
* Registering a block type in PHP would allow for attribute default values to be assigned as dynamically generated from some external state (e.g. a database value, or localized string).
* By default, JSON does not support localization or dynamic values.
* On the server, a block type `icon` property can only be assigned as a string and thus cannot support SVGs and component-based icons.

---

# Block Type Registration RFC

## Introduction

Blocks are the fundamental elements of the editor. They are the primary way in which plugins and themes can register their own functionality and extend the capabilities of the editor.

## Registering a block type

To register a new block type, start by creating a `block.json` file. This file:

* Gives a name to the block type.
* Defines some important metadata about the registered block type (title, category, icon, description, keywords).
* Defines the attributes of the block type.
* Links to the editor implementation of your block type, the save function and any other context-aware property.

**Example:**


```json
{
	"name": "my-plugin/notice",
	"title": "Notice",
	"category": "common",
	"icon": "star",
	"description": "Shows warning, error or success notices  ...",
	"keywords": [ "alert", "message" ],
	"attributes": {
		"message": {
			"type": "string",
			"source": "html",
			"selector": ".meessage"
		}
	},
	"edit": "blocks/notice-edit.js",
	"save": "blocks/notice-save.js",
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

**Important Note:**

Other block properties that point to JavaScript files use this identifier to provide values of the given properties.

For instance, to define an SVG icon in a `block.js` file, you should attach it to the blocks global variable like so:

```js
blocks[ 'core/heading' ].icon = // SVG element of the icon. 
```

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

Plugins and Themes can also register [custom block categories](https://wordpress.org/gutenberg/handbook/designers-developers/developers/filters/block-filters/#managing-block-categories).

An implementation should expect and tolerate unknown categories, providing some reasonable fallback behavior (e.g. a "common" category).

### Icon

* Type: `string`|`object`
* Optional
* Localized: No
* Property: `icon`

```json
{ "icon": "smile" }
```
```json
{ "icon": {
	"slug": "star",
	"src": "./my-file.js",
	"foreground": "#000000",
	"background": "#FFFFFF",
} }
```

An icon property should be specified to make it easier to identify a block. These can be any of WordPress' Dashicons (slug serving also as a fallback if non-js contexts), and a path to a JavaScript file containing the block's icon property custom SVG element.

Besides the dashicon or the source of the SVG element, the icon object can contain background and foreground colors, this colors will appear with the icon when they are applicable e.g.: in the inserter.

**Note:** Custom SVG icons are automatically wrapped in the [wp.components.SVG](https://wordpress.org/gutenberg/handbook/designers-developers/developers/components/svg/) component to add accessibility attributes (aria-hidden, role, and focusable).


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

Sometimes a block could have aliases that help users discover it while searching. For example, an image block could also want to be discovered by photo. You can do so by providing an array of terms (which can be translated). It is only allowed to add as much as three terms per block.

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

See the [the attributes documentation](https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-attributes/) for more details.

### Edit

* Type: `string` (`WPDefinedPropertyFile`)
* Optional
* Localized: No
* Property: `edit`

```json
{ "edit": "my-block-edit.js" }
```

This property is a pointer to a JavaScript file containing the edit function of the block type. The edit function describes the structure of your block in the context of the editor. This represents what the editor will render when the block is used.

See the [Edit and Save](https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-edit-save/) documentation for more details.

**Important Note:**

The `WPDefinedPropertyFile` type described here is a subtype of string, where the value must represent an absolute or relative path to a file by which a dynamic value or values of a property can be interpreted.

_TBD: Describe the resolution behavior by file extension, and consider further extension-specific subtypes (e.g. WPDefinedJSPropertyFile)._

### Save

* Type: `string` (`WPDefinedPropertyFile`)
* Optional
* Localized: No
* Property: `save`

```json
{ "save": "my-block-save.js" }
```

This property is a pointer to a JavaScript file containing the save function of the block type. The save function defines the way in which the different attributes should be combined into the final markup, which is then serialized by Gutenberg into `post_content`.

See the [Edit and Save](https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-edit-save/) documentation for more details.

If omitted, the implementation should fall back to one as if it were defined as a function returning `null`, where the expected behavior is to serialize without any inner HTML (a "void block").

### Render Callback

* Type: `string` (`WPDefinedPropertyFile`)
* Optional
* Localized: No
* Property: `renderCallback`

```json
{ "renderCallback": "my-block-render-callback.php" }
```

This is a pointer to a php file returning a render callback php function.  The render callback is function called when the block is rendered on the frontend. It's used to generate the frontend markup dynamically.

See the [dynamic blocks documentation](https://wordpress.org/gutenberg/handbook/designers-developers/developers/tutorials/block-tutorial/creating-dynamic-blocks/) for more details.

### Styles Variations

*   Type: `array`
*   Optional
*   Localized: No
*   Property: `styleVariations`

```json
{ 
    "styleVariations": 
        [ 
			{ "name": "default", "label": "Default", "isDefault": true }, 
			{ "name": "other", "label": "Other" }
		]
}
```

Block styles can be used to provide alternative styles to block. It works by adding a class name to the block's wrapper. Using CSS, a theme developer can target the class name for the style variation if it is selected.

Plugins and Themes can also register [custom block style](https://wordpress.org/gutenberg/handbook/designers-developers/developers/filters/block-filters/#block-style-variations) for existing blocks.

### Transforms

* Type: `string`
* Optional
* Localized: No
* Property: `transforms`

```json
{ "transforms": "my-block-transforms.js" }
```

This property is a pointer to a JavaScript file containing the save function of the block transforms. The save function defines the way in which the different attributes should be combined into the final markup, which is then serialized by Gutenberg into `post_content`.

See the [Transforms](https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-registration/#transforms-optional) documentation for more details.

### Deprecated versions

* Type: `object[]`
* Optional
* Localized: No
* Property: `deprecated`

```json
{ "deprecated": [ {
	"attributes": {},
	"save": "my-deprecated-save.js",
	"supports": {}
} ] }
```

This property contains the definition of the deprecated versions of the block type. It is used to ensure that old blocks with old markup are not considered invalid.

See the [Deprecated Blocks](https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-deprecation/) documentation for more details.

### Supports

* Type: `object`
* Optional
* Localized: No
* Property: `supports`

Optional block extended support features. 

See the [block supports](https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-registration/#supports-optional) documentation page for more details.

### Stylesheets

* Type: `object`
* Optional
* Localized: No
* Property: `stylesheets`

```json
{
	"stylesheets": {
		"main": "my-block-style.css",
		"editor": "my-block-editor-style.css",
		"theme": "my-block-theme-style.css"
	}
}
```

This property is a pointer to CSS files containing the CSS used for the block in different contexts.

## Internationalization

Localized properties are automatically wrapped in `__` function calls on the backend and the frontend of WordPress. These translations are added as an inline script to the `wp-block-library` script handle. 

WordPress string discovery automatically includes these strings to the plugin's or core's domain name.

## PHP Runtime

WordPress automatically discovers all the block.json files in the plugin/core `blocks` folder and registers the corresponding block types. These block types are made available through the [block registry](https://developer.wordpress.org/reference/classes/wp_block_type_registry/) PHP class and the blocks scripts and styles are added as dependencies to the `wp-block-library` script and style handles.

## Backward Compatibility

The existing registration mechanism (both server side and frontend) will continue to work, it will serve as low-level implementation detail for the `block.json` based registration.

Core Blocks will be migrated iteratively and third-party blocks will see warnings appearing in the console to encourage them to refactor the block registration API used.
