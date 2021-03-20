# Anatomy of a Block

At its simplest, a block in the WordPress block editor is a JavaScript object with a specific set of properties.

**Note:** Block development uses ESNext syntax, this refers to the latest JavaScript standard. If this is unfamiliar, I recommend reviewing the [ESNext syntax documentation](/docs/how-to-guides/javascript/esnext-js.md) to familiarize yourself with the newer syntax used in modern JavaScript development.

Here is the complete code for registering a block:

```js
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';

registerBlockType( 'create-block/gutenpride', {
	apiVersion: 2,
	title: 'Gutenpride',
	description: 'Example block.',
	category: 'widgets',
	icon: 'smiley',
	supports: {
		// Removes support for an HTML mode.
		html: false,
	},

	edit: () => {
		const blockProps = useBlockProps();
		return <div { ...blockProps }> Hello in Editor. </div>;
	},

	save: () => {
		const blockProps = useBlockProps.save();
		return <div { ...blockProps }> Hello in Save.</div>;
	},
} );
```

The first parameter in the **registerBlockType** function is the block name, this should match exactly to the name registered in the PHP file.

The second parameter to the function is the block object. See the [block registration documentation](/docs/reference-guides/block-api/block-registration.md) for full details.

The **title** is the title of the block shown in the Inserter.

The **icon** is the icon shown in the Inserter. The icon property expects any Dashicon name as a string, see [list of available icons](https://developer.wordpress.org/resource/dashicons/). You can also provide an SVG object, but for now it's easiest to just pick a Dashicon name.

The **category** specified is a string and must be one of: "common, formatting, layout, widgets, or embed". You can create your own custom category name, [see documentation for details](/docs/reference-guides/filters/block-filters.md#managing-block-categories).

The last two block object properties are **edit** and **save**, these are the key parts of a block. Both properties should be defined as functions.

The results of the edit function is what the editor will render to the editor page when the block is inserted.

The results of the save function is what the editor will insert into the **post_content** field when the post is saved. The post_content field is the field in the WordPress database used to store the content of the post.

**Note:** The `block.json` file is also generated with your plugin. This file is used for registering with the block directory, as you change the properties you should update in both spots. _Development is on-going to simplify this process so only one location is required._

## Internationalization

If you look at the generated `src/index.js` file, the block title and description are wrapped in a function that looks like this:

```js
__( 'Gutenpride', 'gutenpride' );
```

This is an internationalization wrapper that allows for the string "Gutenpride" to be translated. The second parameter, "gutenpride" is called the text domain and gives context for where the string is from. The JavaScript internationalization, often abbreviated i18n, matches the core WordPress internationalization process. See the [Internationalization in Plugin Developer Handbook](https://developer.wordpress.org/plugins/internationalization/) for more details.

Next Section: [Block Attributes](/docs/getting-started/tutorials/create-block/attributes.md)
