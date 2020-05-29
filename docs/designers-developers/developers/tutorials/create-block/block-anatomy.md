
# Anatomy of a Gutenberg Block

At its simplest, a block in Gutenberg is a JavaScript object with a specific set of properties. Here is the complete code for registering a block:

```js
import { registerBlockType } from '@wordpress/blocks';

registerBlockType( 'create-block/gutenpride', {
	title: 'Gutenpride',
	description: 'Example block.',
	category: 'widgets',
	icon: 'smiley',
	supports: {
		// Removes support for an HTML mode.
		html: false,
    },

    edit: ( ) => {
        return (
            <div> Hello in Editor. </div>
        );
    },

    save: ( ) => {
        return (
            <div> Hello in Save.</div>
        );
    },
} );
```

The first parameter in the **registerBlockType** function is the block name, this should match exactly to the name registered in the PHP file.

The second parameter to the function is the block object. See the [block registration documentation](https://developer.wordpress.org/block-editor/developers/block-api/block-registration/) for full details.

The **title** is the title of the block shown in the Inserter.

The **icon** is the icon shown in the Inserter. The icon property expects any Dashicon name as a string, see [list of available icons](https://developer.wordpress.org/resource/dashicons/). You can also provide an SVG object, but for now it's easiest to just pick a Dashicon name.

The **category** specified is a string and must be one of: \"common, formatting, layout, widgets, or embed\". You can create your own custom category name, [see documentation for details](https://developer.wordpress.org/block-editor/designers-developers/developers/filters/block-filters/#managing-block-categories). For this tutorial, I specified "widgets" as the category.

The last two block object properties are **edit** and **save**, these are the key parts of a block. Both properties should be defined as functions.

The results of the edit function is what the editor will render to the editor page when the block is inserted.

The results of the save function is what the editor will insert into the **post_content** field when the post is saved. The post_content field is the field in the WordPress database used to store the content of the post.

## Internationalization

If you look at the generated `src/index.js` file, the block title and description are wrapped in a function that looks like this:

```js
__('Gutenpride', 'create_block')
```

This is an internationalization wrapper that allows for the string "Gutenpride" to be translated. The second parameter, "create_block" is called the text domain and gives context for where the string is from. The JavaScript internationalization, often abbreviated i18n, matches the core WordPress internationalization process. See the [I18n for WordPress documentation](https://codex.wordpress.org/I18n_for_WordPress_Developers) for more details.
