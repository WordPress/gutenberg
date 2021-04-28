# Create a block theme

The purpose of this tutorial is to show how to create a block theme and help theme developers transition to full site editing.
It is recommended that you first read the [block theme overview](/docs/how-to-guides/themes/block-theme-overview.md).

You will learn about the required files, how to combine templates and template parts, how to add presets for global styles, and how to add blocks and export the templates in the site editor.

Full site editing is an experimental feature and the workflow in this tutorial is likely to change.

This tutorial is up to date as of Gutenberg version 10.6.

## Table of Contents

1.  [What is needed to create a block-theme?](#what-is-needed-to-create-a-block-theme)
2.  [Creating the theme](#creating-the-theme)
3.  [Creating the templates and template parts](#creating-the-templates-and-template-parts)
4.  [experimental-theme.json - Global styles](#experimental-theme-json-global-styles)
5.  [Using query and loop blocks](#using-query-and-loop-blocks)
6.  [Layouts](#layouts)
7.  [Additional templates](#additional-templatess)
8.  [Creating custom templates](#creating-custom-templates)

## What is needed to create a block theme?

To be able to use a block theme you first need to activate the Gutenberg plugin.

### Required files and file structure

There are two files that are required to be able to activate any theme:
`index.php` and `style.css`.

A block theme is built using HTML templates and template parts. For the plugin to recognise that it is a block theme,
the theme must also include an `index.html` template.

The theme may optionally include a functions.php file, to enqueue custom CSS and add theme support,
and a [experimental-theme.json file](/docs/how-to-guides/themes/theme-json.md) to manage global styles.

You decide what additional templates and template parts to include in your theme.
Templates are the main files used in the [template hierarchy](https://developer.wordpress.org/themes/basics/template-hierarchy/), for example index, single or archive. Templates can optionally include structural template parts, for example a header, footer or sidebar.

Each template or template part contains the [block grammar](/docs/explanations/architecture/key-concepts/), the HTML, for the selected blocks. The block HTML is generated in and exported from the **site editor**. It can also be added to the theme's HTML files manually.

Templates are placed inside the `block-templates` folder, and template parts are placed inside the `block-template-parts` folder:

```
theme
|__ style.css
|__ functions.php
|__ index.php
|__ experimental-theme.json
|__ block-templates
	|__ index.html
	|__ single.html
	|__ archive.html
	|__ ...
|__ block-template-parts
	|__ header.html
	|__ footer.html
	|__ sidebar.html
	|__ ...
```

## Creating the theme

Create a new folder for your theme in `/wp-content/themes/`.
Inside this folder, create the `block-templates` and `block-template-parts` folders.

Create a `style.css` file. The file header in the `style.css` file has [the same items that you would use in a traditional theme](https://developer.wordpress.org/themes/basics/main-stylesheet-style-css/#explanations).

```
/*
Theme Name: My first theme
Theme URI:
Author: The WordPress team
Author URI: https://wordpress.org/
Description:
Tags:
Version: 1.0.0
Requires at least: 5.0
Tested up to: 5.7
Requires PHP: 7.0
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: myfirsttheme

This theme, like WordPress, is licensed under the GPL.
Use it to make something cool, have fun, and share what you've learned with others.
*/
```

Create an `index.php` file.
This file is used as a fallback if the theme is activated without Gutenberg.
You may leave the file empty for this tutorial.


Opttionally, create a `functions.php` file.
In this file, you can enqueue `style.css`, include additional files,
enable an editor stylesheet and add theme support.

Support for the title tag is already enabled for all block themes,
and most of the theme support will be added in the experimental-theme.json file.

```php
<?php
if ( ! function_exists( 'myfirsttheme_setup' ) ) :
/**
 * Sets up theme defaults and registers support for various WordPress features.
 *
 * Note that this function is hooked into the after_setup_theme hook, which runs
 * before the init hook. The init hook is too late for some features, such as indicating
 * support post thumbnails.
 */
function myfirsttheme_setup() {
	/**
	 * Add default posts and comments RSS feed links to <head>.
	 */
	add_theme_support( 'automatic-feed-links' );

	/**
	 * Enable support for post thumbnails and featured images.
	 */
	add_theme_support( 'post-thumbnails' );

	add_theme_support( 'editor-styles' )

	add_theme_support( 'wp-block-styles' );
}
endif; // myfirsttheme_setup
add_action( 'after_setup_theme', 'myfirsttheme_setup' );

/**
 * Enqueue theme scripts and styles.
 */
function myfirsttheme_scripts() {
	wp_enqueue_style( 'myfirsttheme-style', get_stylesheet_uri() );
}
add_action( 'wp_enqueue_scripts', 'myfirsttheme_scripts' );
```

It is no longer necesarry to enqueue the comment reply script,
because it is included with the comments block.

Inside the block-templates folder, create a blank `index.html` file.

Your theme should now include the following files and folders:

```
theme
 |__ style.css
 |__ functions.php (optional)
 |__ index.php
 |__ block-templates
 	|__ index.html
 |__ block-template-parts
 	|__ (empty folder)
```

### Creating the templates and template parts

Now that you have the required files you can choose to create templates and template parts manually,
via the site editor or via the template editing mode.

#### Manual template creation

Create two template part files called `footer.html` and `header.html` and place them inside the `block-template-parts` folder.

When you add blocks manually to your HTML files, you will start by adding an HTML comment that includes the block name prefixed with `wp:`.

There are both self-closing and multi-line blocks:

Add the site title to `header.html`:

```html
<!-- wp:site-title /-->
```

And a credit text to `footer.html`:

```html
<!-- wp:paragraph -->
<p>Proudly powered by <a href="https://wordpress.org/">WordPress</a>.</p>
<!-- /wp:paragraph -->
```

The blocks are self-containing, the opening tag and the closing tag for a multi-line block must be in the same template.
You would not be able to place an opening tag for a group block in a header template and close it in a footer template.

Open `index.html` and include the template parts by adding two HTML comments.
The HTML comments starts with `wp:template-part` which is the name of the template-part block.
Each template part is identify by its slug, the name of the file without the file ending.

Inside the HTML comment, add two curly brackets and the key, "slug", together with the name of the template part:

```html
<!-- wp:template-part {"slug":"header"} /-->

<!-- wp:template-part {"slug":"footer"} /-->
```

All block attributes are placed inside these curly brackets.
For example, if you wanted the paragraph in `footer.html` to be centered,
you would use the align attribute:

```html
<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center">Proudly powered by
<a href="https://wordpress.org/">WordPress</a>.</p>
<!-- /wp:paragraph -->
```

The HTML element that wraps the content also needs to use the corresponding CSS class:
```has-text-align-center```.

#### Template creation in the site editor

To access the site editor to create templates and template parts, you first need to activate the basic block theme that we created in [step 2] (#creating-the-theme).

Open the Site Editor from the WordPress admin menu. The default view is the blank index.html template.

Open the Add block menu and select and place a new template part.
The block will have the default name "Untitled Template Part".
Open the advanced section of the block settings sidebar and make the following changes:
Change the title and area to Header, and the HTML element to ```<header>```.

Save the changes. You will be asked if you want to save the template part, the index template, or both. Choose both.
Repeat the process and add a footer template part.

Add your preferred blocks to the header and footer template parts, for example a navigation block, a cover block with a site logo, title and tagline, or a columns block with contact information. Save the changes.

##### Exporting

The template, template parts saved to the database as custom post types, but they need to be exported as theme files.

In the site editor, open the "More tools and options menu"
Select the Export option to download a zip file containing the files.
From here, some assembly is required.
Copy the updated index.html file from theme/block-templates/ folder to your themes block-templates folder.
Copy template part one and two from theme/block-template-parts/ folder your themes block-template-parts folder.
Rename the template parts to header.html and footer.html respectively.
Then open index.html and update the slugs in the block markup.

To use the theme files and not the saved templates and template parts,
you need to go to the Appearance menu -> Templates/Template parts and delete them.

To create your theme you will likely use a combination of manually created files and the site editor.
You can assemble blocks in the block editor, and copy the markup from the code editor mode to your theme files.

### Experimental-theme.json - Global styles

The `experimental-theme.json` is a configuration file that can be used to
enable or disable features and set default styles for both the website and individual block types.

Style settings are converted to CSS custom properties (CSS variables) and enqueued both for the editor and the front,
reducing the need for the theme to enque block styles.

To make the most out of this tutorial please read the [documentation for global styles](/docs/how-to-guides/themes/theme-json.md).

[Learn more about the JSON format (external link)](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON)

Create a file called `experimental-theme.json` and save it inside the main folder.

You will start by adding some of the theme support that you previously added to functions.php,
but first, add two curly brackets to the file:

```json
{

}
```

Next, add three main sections:
Settings -Where you will enable features and create presets for styles.
Styles -Where you apply styles to the website, elements and blocks.
templateParts -where you assign template part files to template areas.

```json
{
	"settings": {
	},
	"styles": {
	},
	"templateParts": {
	}
}
```

#### Content width and theme support for wide and full width blocks

Inside settings, include the layout option:
The contentSize is the default width of the blocks. wideSize is the wide width.
The example uses pixels but any CSS value is valid.

```json
	"layout": {
		"contentSize": "840px",
		"wideSize": "1100px"
	}
```

This will enable the layout setting for parent blocks in the editors.
With this seting, inner blocks can either inherit the widths that are set in the experimental-theme.json
file, or use specific values.

#### Color palette

The equivalent of add_theme_support( 'editor-color-palette' ).
You can add mulitple color palettes, a default palette for all blocks,
and color palettes that are specific to a block type.

Inside settings, add a default color palette with following code:

```json
"color": {
	"palette": [
		{
			"slug": "strong-magenta",
			"color": "#a156b4"
		},
		{
			"slug": "very-dark-gray",
			"color": "#444"
		}
	]
}
```

Add a trailing comma to separate the objects, and add a palette for the heading block.
This palette will be used instead of the default theme palette.

```json
"blocks": {
	"core/heading/": {
		"color": {
			"palette": [
				{
					"slug": "light-blue",
					"color": "#5d8ac8"
				},
				{
					"slug": "light-grey",
					"color": "#ccc"
				}
			]
		}
	}
}
```

This code generates the following CSS:

```css
:root {
	--wp--preset--color--strong-magenta: #a156b4;
	--wp--preset--color--very-dark-gray: #444;
}

h2 {
	--wp--preset--color--light-blue: #5d8ac8;
	--wp--preset--color--light-grey: #ccc;
}
```

Apply the dark grey color to the body background by adding ```color``` as a top key under styles:

```json
"styles": {
	"color": {
		"background": "var(--wp--preset--color--very-dark-gray)"
	}
}
```

#### Typography

#### Borders

#### Spacing

#### Custom

#### Elements

#### Template parts


## Using query and loop blocks

## Layouts

-Using the layout setting and inherit

## Additional templates

-We only created an index so far, create single, 404, search and archives.

## Creating custom templates

Assigning custom templates in theme-json.


