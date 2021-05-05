# Create a block theme

The purpose of this tutorial is to show how to create a block theme and help theme developers transition to full site editing.
It is recommended that you first read the [block theme overview](/docs/how-to-guides/themes/block-theme-overview.md).

You will learn about the required files, how to combine templates and template parts, how to add presets for global styles, and how to add blocks and export the templates in the site editor.

Full site editing is an experimental feature, and the workflow in this tutorial is likely to change.

This tutorial is up to date with Gutenberg version 10.6.

## Table of Contents

1.  [What is needed to create a block-theme?](#what-is-needed-to-create-a-block-theme)
2.  [Theme setup](#theme-setup)
3.  [Creating the templates and template parts](#creating-the-templates-and-template-parts)
4.  [experimental-theme.json - Global styles](#experimental-theme-json-global-styles)
5.  [Layouts](#layouts)
6.  [Custom templates](#custom-templates)
7.  [Sharing your theme](#sharing-your-theme)

## What is needed to create a block theme?

To use a block theme, you first need to activate the Gutenberg plugin.

### Required files and file structure

There are two files that are required to activate any theme: `index.php` and `style.css`.
For the plugin to recognize that a block theme is active, the theme must also include an `index.html` template
inside a folder called `block-templates`.

The theme may optionally include a functions.php file and an [experimental-theme.json file](/docs/how-to-guides/themes/theme-json.md) to manage global styles.

Templates are the main files used in the [template hierarchy](https://developer.wordpress.org/themes/basics/template-hierarchy/), for example, index, single or archive. Templates can include structural template parts like a site header or footer.

Place templates inside the `block-templates` folder, and template parts inside the `block-template-parts` folder:

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

## Theme setup

Create a new folder for your theme in `/wp-content/themes/`.
Inside this folder, create the `block-templates` and `block-template-parts` folders.

Create a `style.css` file. The file header in the `style.css` file has [the same items you would use in a classic theme](https://developer.wordpress.org/themes/basics/main-stylesheet-style-css/#explanations).

```CSS
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

Inside the `block-templates` folder, create a blank `index.html` file.

Optionally, create a `functions.php` file.
In this file, you can enqueue `style.css`, include additional files, enable an editor stylesheet and add theme support.

The theme support in functions.php is more limited than in a classic theme because you will add most of the theme support in the experimental-theme.json file.
The title tag is already enabled for all block themes, and it is no longer necesarry to enqueue the comment reply script because it is included with the comments block.

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

## Creating the templates and template parts

Now that you have the required files, you can choose to create templates and template parts manually
or via the site editor or the template editing mode.

To create your theme, you will likely use a combination of manually created files and the site editor.
You can assemble blocks in the block editor and copy the block markup from the code editor mode to your theme files.

### Manual template creation

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

The blocks are self-containing; the opening tag and the closing tag for a multi-line block must be in the same template.
You would not be able to place an opening tag for a group block in a header template and close it in a footer template.

Open `index.html` and include the template parts by adding two HTML comments.
The HTML comments start with `wp:template-part`, which is the name of the template-part block.
Each template part is identified by the slug, the name of the file without the file ending.

Inside the HTML comment, add two curly brackets and the key, `slug`, together with the name of the template part:

```html
<!-- wp:template-part {"slug":"header"} /-->

<!-- wp:template-part {"slug":"footer"} /-->
```

All block attributes are placed inside these curly brackets. If you wanted the paragraph in `footer.html` to be centered, you would use the align attribute:

```html
<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center">Proudly powered by <a href="https://wordpress.org/">WordPress</a>.</p>
<!-- /wp:paragraph -->
```

The HTML element that wraps the content also needs to use the corresponding CSS class: `has-text-align-center`.

### Template creation in the site editor

To access the site editor to create templates and template parts, you first need to activate the basic block theme created in [step 2](#creating-the-theme).

Open the Site Editor from the WordPress admin menu. The default view is the blank index.html template.

Open the Add block menu and select and place a new template part.
The block will have the default name "Untitled Template Part".

Open the advanced section of the block settings sidebar and make the following changes:
Change the title and area to Header, and the HTML element to `<header>`.

Save the changes. You will be asked if you want to save the template part, the index template, or both. Choose both. Repeat the process and add a footer template part.

Add your preferred blocks to the header and footer template parts, for example, a navigation block, a cover block with a site logo, or a columns block with contact information. Save the changes.

### Template editing mode

The template editing mode is a way to edit the website without the complexity of the site editor interface.
It is more limited than the site editor because you can not create, select or navigate between templates in this view.

You can access the template editing mode via the block editor.
When the document settings sidebar is open, you can find the Template panel below Status & Visibility.
Here you will find information about the current template, and you can create a new blank template or change to an existing template.

### Exporting

Templates and template parts created or edited in the site editor are saved to the database as custom post types. To export them as theme files, follow these steps:

- In the site editor, open the "More tools and options menu".
- Select the Export option to download a zip file containing the files.
- Copy the updated index.html file from theme/block-templates/ folder to your themes block-templates folder.
- Copy template part one and two from theme/block-template-parts/ folder to your themes block-template-parts folder.
- Rename the template parts to header.html and footer.html, respectively.
- Open index.html and update the slugs in the block markup.

Saved templates have precedence over theme files. To use the updated theme files, go to Appearance > Templates/Template parts and delete the saved templates.

#### Additional templates

Now the theme has a basic site header and footer, but it does not display any content.
To create a blog, a list of the latest posts, you would use the query and query loop blocks together.

Wether you are using the site editor or editing theme files directly, open the index tempalte and add a query block.

When you place a query block in the editor, the query loop is used as an inner block.
You have the option to start with an empty loop or include selected post blocks like a post title and featured image.

Example markup:

```html
<!-- wp:query  -->
<div class="wp-block-query"><!-- wp:query-loop -->
<!-- wp:post-title /-->
<!-- wp:post-date /-->
<!-- wp:post-excerpt /-->
<!-- /wp:query-loop --></div>
<!-- /wp:query -->
```

The pagination block that lets you navigate between pages of posts can only be used inside the query.
It needs to be placed inside the query, but outside the loop:

```html
<!-- wp:query  -->
<div class="wp-block-query"><!-- wp:query-loop -->
<!-- wp:post-title /-->
<!-- wp:post-date /-->
<!-- wp:post-excerpt /-->
<!-- /wp:query-loop -->

<!-- wp:query-pagination -->
<div class="wp-block-query-pagination">
<!-- wp:query-pagination-previous /-->
<!-- wp:query-pagination-numbers /-->
<!-- wp:query-pagination-next /--></div>
<!-- /wp:query-pagination -->

</div>
<!-- /wp:query -->
```

When you add the query, you also want to make sure that the post title block is a link, otherwise, you can not reach the single posts from the blog. The link option can be enabled in the block setting sidebar of the post title block.

The block markup for a post title with the link enabled is: `<!-- wp:post-title {"isLink":true} /-->`

Next, create a new template for displaying single posts.
If you are editing theme files directly, create a file called single.html inside the block-templates folder.

Add the site header and site footer template parts:

```html
<!-- wp:template-part {"slug":"header"} /-->

<!-- wp:template-part {"slug":"footer"} /-->
```

Add a group block that will work as a container for your post.
This will enable the width options for the inner blocks.

```html
<!-- wp:template-part {"slug":"header"} /-->
<!-- wp:group -->
<div class="wp-block-group"></div>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer"} /-->
```

Add your preffered blocks inside the group block. Some of the new blocks that are available are:

- Post content: `<!-- wp:post-content /-->`
- Post title: `<!-- wp:post-title /-->`
- Post author: `<!-- wp:post-author /-->`
- Post date: `<!-- wp:post-date /-->`
- Post featured image: `<!-- wp:post-featured-image /-->`
- Post tags: `<!-- wp:post-tags /-->`
- Post categories: `<!-- wp:post-hierarchical-terms "term":"category"} /-->`
- Next and previous post: `<!-- wp:post-navigation-link /--><!-- wp:post-navigation-link {"type":"previous"} /-->`

Save the HTML file, or save and export the post template if you are working in the site editor.

Copy all the blocks and create a template for displaying pages.
You can copy the single.html file as page.html inside the block-templates folder.
Adjust the blocks for the page template, and save.

If you preview your theme now, the blog, single posts, pages, archives and search results should display correctly,
but without styling.

If a theme does not use an archive or search result template, the index template will be used as a fallback.
To make sure that the query block shows the correct results depending on the context, it has an attribute called `inherit` that filters the query automatically. This option is enabled by default.

If you want, you can continue creating archives or search tempaltes, a 404 template, or adding comments to your post or pages.

## Experimental-theme.json - Global styles

The `experimental-theme.json` is a configuration file used to enable or disable features and set default styles for both the website and blocks.

Style settings are converted to CSS custom properties (CSS variables) and enqueued for the editor and the front,
reducing the need for the theme to enqueue block styles.

To make the most out of this tutorial please read the [documentation for global styles](/docs/how-to-guides/themes/theme-json.md).

[Learn more about the JSON format (external link)](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON)

Create a file called `experimental-theme.json` and save it inside the main theme folder.

You will start by adding two curly brackets to the file:

```json
{

}
```

Next, add three main sections:

- Settings -Where you will enable features and create presets for styles.
- Styles -Where you apply styles to the website, elements, and blocks.
- templateParts -Where you assign template part files to template areas.

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

### Content width and theme support for wide and full-width blocks

Add the layout option under settings:
The `contentSize` is the default width of the blocks. `wideSize` is the wide width.
The example uses pixels, but any CSS value is valid.

```json
"layout": {
	"contentSize": "840px",
	"wideSize": "1100px"
}
```

This code will enable the layout setting for parent blocks in the editors. With this setting, inner blocks can either inherit the widths from the experimental-theme.json file or use specific values.

### Color palette

This is the equivalent of `add_theme_support( 'editor-color-palette' )`.
You can add multiple color palettes: a default palette for all blocks and color palettes specific to a block type.

Inside settings, add a default color palette with the following code:

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

Apply the dark grey color to the body background by adding `color` as a top key under `styles`:

```json
"styles": {
	"color": {
		"background": "var(--wp--preset--color--very-dark-gray)"
	}
}
```

### Typography

For a list of all typography features that can be enabled, please see the [documenation for theme.json](https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-json/#settings).

To add custom font sizes, create a new section called `typography` inside `settings`.
`FontSizes` is the equivalent of `add_theme_support( 'editor-font-sizes' )`.

```json
"typograhy": {
	"fontSizes": [
	]
}
```

The keys used by fontSizes are:

- `slug` A unique identifier for the size (you may remember this from the color palette).
- `size` The size value. This can be unitless or use any valid CSS value.
- `name` The visible name in the editor.

```json
"typograhy": {
	"fontSizes": [
		{
			"slug": "extra-small",
			"size": "16px",
			"name": "Extra small"
		}
	]
}
```

The example above will generates the following CSS:

```css
:root {
	--wp--preset--font-size--extra-small: 16px;
}
```

And to apply this preset to a block using experimental-theme.json, you can follow these steps:
Inside styles, create a new section called blocks:

```json
"blocks": {

}
```

Add the name of the block that you want to set a default for, in this case, post tags:

```json
"blocks": {
	"core/post-tags": {
	},
}
```

Add the typography setting, and set fontSize to the preset that you created:

```json
"blocks": {
	"core/post-tags": {
		"typography": {
			"fontSize": "var(--wp--preset--font-size--extra-small)"
		}
	},
}
```

Note: If your preset is unitless, add calc() and the unit to the value.

The resulting CSS is:

```css
.wp-block-post-tags {
	font-size: var(--wp--preset--font-size--extra-small);
}
```

### Borders

### Spacing

### Custom

### Elements

### Template parts

In the templeParts section, assign the two template parts that you created to their template areas.
Add two keys: `name`, which is the file name of the template part file without the file ending,
and `area`, the name of the template area.

There are three template areas to choose from: Header, footer, and general.

```json
"templateParts": [
	{
		"name": "header",
		"area": "header"
	},
	{
		"name": "footer",
		"area": "footer"
	}
]
```

## Layouts

The benefit of enabling the layout setting in experimental-theme.json is that you no longer need to add extra CSS for the alignments or widths. You can also set more precise widths to blocks inside containers.

The first thing you need to know is that blocks have different options available depending on if you are using the block editor or the site editor.
When you are working in the block editor, your blocks are already placed inside a container.
In the site editor, you can choose to use a container like a group or template part block.

If you place an image block in the canvas of the site editor, it will not have any alignment or width options,
and it will be positioned to the left.

If you place the image block inside a group block, the options depend on the layout settings in the group block.

- Without changes to the layout settings, you can align the image to the left, center, or right.
- When the layout setting inherits the width from experimental-theme.json, you can set the image's width to default, wide or full width.
- When the content width and wide width have been specified, the image's width is adjusted and can be set to default, wide or full width.

## Creating custom templates

Custom templates for posts, pages, and custom post types can be created by adding additional HTML files inside the
`block-templates` folder.

In a classic theme, templates are identified with a file header. In a block theme, you list templates in the experimental-theme.json file.

All templates that are listed in the customTemplates section of experimental-theme.json will be selectable in the site editor.

If you want to assign the template to a post or page in the block editor, the template's file name needs to be prefixed with either post or page.

First, create a section called `customTemplates` at the root level of experimental-theme.json.
This section has two required keys:
`Name`, which is the name of the template file without the file ending.
`title`, which is the visible title of the template in the editors.

```json
"customTemplates": [
	{
		"name": "page-home",
		"title": "Page without title"
	}
]
```

There is also an optional setting where you can decide which post types that can use the template.
`postTypes`, followed by the name of the post type.

```json
"customTemplates": [
	{
		"name": "page-home",
		"title": "Page without title"
	},
	{
		"name": "page-contact",
		"title": "Contact",
		"postTypes": [
			"page"
		]
	}
]
```

If you include more than one template, separate them with a comma.


## Sharing your theme

If you would like feedback on your theme and want to share it with others, you can submit it to
the [theme experiments GitHub repository](https://github.com/WordPress/theme-experiments).

