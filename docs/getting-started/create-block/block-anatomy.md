# Anatomy of a Block

At its simplest, a block in the WordPress block editor is a JSON object with a specific set of properties.

<div class="callout callout-info">
<strong>Note:</strong> Block development uses ESNext syntax, this refers to the latest JavaScript standard. If this is unfamiliar, review the <a href="https://developer.wordpress.org/block-editor/how-to-guides/javascript/esnext-js/">ESNext syntax documentation</a> to familiarize yourself with the newer syntax.
</div>

The javascript part is done in the `src/index.js` file.

```js
import { registerBlockType } from '@wordpress/blocks';

import './style.scss';

import Edit from './edit';
import save from './save';

registerBlockType( 'create-block/gutenpride', {
	/**
	 * @see ./edit.js
	 */
	edit: Edit,
	/**
	 * @see ./save.js
	 */
	save,
} );
```

The first parameter in the **registerBlockType** function is the block name, this should match exactly to the name registered in the PHP file.

The second parameter to the function is the block object. See the [block registration documentation](/docs/reference-guides/block-api/block-registration.md) for full details.

The last two block object properties are **edit** and **save**, these are the key parts of a block. Both properties are functions that are included via the import above.

The results of the edit function is what the editor will render to the editor page when the block is inserted.

The results of the save function is what the editor will insert into the **post_content** field when the post is saved. The post_content field is the field in the WordPress database used to store the content of the post.

Most of the properties are set in the `block.json` file.

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json",
	"apiVersion": 2,
	"name": "create-block/gutenpride",
	"version": "0.1.0",
	"title": "Gutenpride",
	"category": "text",
	"icon": "flag",
	"description": "A Gutenberg block to show your pride! This block enables you to type text and style it with the color font Gilbert from Type with Pride.",
	"supports": {
		"html": false
	},
	"textdomain": "gutenpride",
	"editorScript": "file:./index.js",
	"editorStyle": "file:./index.css",
	"style": "file:./style-index.css"
}
```

The **title** is the title of the block shown in the Inserter and in other areas of the editor.

The **icon** is the icon shown in the Inserter. The icon property expects any Dashicon name as a string, see [list of available icons](https://developer.wordpress.org/resource/dashicons/). You can also provide an SVG object, but for now it's easiest to just pick a Dashicon name.

The **category** specified is a string and must be one of: "common, formatting, layout, widgets, or embed". You can create your own custom category name, [see documentation for details](/docs/reference-guides/filters/block-filters.md#managing-block-categories).

## Internationalization

If you look at the generated `src/save.js` file, the block title and description are wrapped in a function that looks like this:

```js
__( 'Gutenpride – hello from the saved content!', 'gutenpride' );
```

This is an internationalization wrapper that allows for the string "Gutenpride" to be translated. The second parameter, "gutenpride" is called the text domain and gives context for where the string is from. The JavaScript internationalization, often abbreviated i18n, matches the core WordPress internationalization process. See the [Internationalization in Plugin Developer Handbook](https://developer.wordpress.org/plugins/internationalization/) for more details.

Next Section: [Block Attributes](/docs/getting-started/create-block/attributes.md)
