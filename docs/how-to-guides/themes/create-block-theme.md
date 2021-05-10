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
4.  [Theme.json - Global styles](#theme-json-global-styles)
5.  [Layouts](#layouts)
6.  [Custom templates](#custom-templates)
7.  [Sharing your theme](#sharing-your-theme)

## What is needed to create a block theme?

To use a block theme, you first need to activate the Gutenberg plugin.

### Required files and file structure

There are two files that are required to activate any theme: `index.php` and `style.css`.
For the plugin to recognize that a block theme is active, the theme must also include an `index.html` template
inside a folder called `block-templates`.

The theme may optionally include a functions.php file and a [theme.json file](/docs/how-to-guides/themes/theme-json.md) to manage global styles.
Template parts are optional. If they are included they must be placed inside a `block-template-parts` folder:

File structure:
```
theme
|__ style.css
|__ functions.php
|__ index.php
|__ theme.json
|__ block-templates
	|__ index.html
	|__ ...
|__ block-template-parts
	|__ header.html
	|__ footer.html
	|__ ...
```

## Theme setup

Create a new folder for your theme in `/wp-content/themes/`.
Inside this folder, create the `block-templates` and `block-template-parts` folders.

Create a `style.css` file. The file header in the `style.css` file has [the same items you would use in a classic theme](https://developer.wordpress.org/themes/basics/main-stylesheet-style-css/#explanations).

```CSS
/*
Theme Name: FSE Tutorial
Theme URI:
Author: The WordPress team
Author URI: https://wordpress.org/
Description:
Tags: full-site-editing, blog
Version: 1.0.0
Requires at least: 5.0
Tested up to: 5.7
Requires PHP: 7.0
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: fse-tutorial

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

The theme support is more limited than in a classic theme because you will add most of the theme support in the
`theme.json` file.
The title tag is already enabled for all block themes, and it is no longer necesarry to enqueue the comment reply script because it is included with the comments block.

```php
<?php
if ( ! function_exists( 'fse_tutorial_theme_setup' ) ) :
	/**
	 * Sets up theme defaults and registers support for various WordPress features.
	 *
	 * Note that this function is hooked into the after_setup_theme hook, which runs
	 * before the init hook. The init hook is too late for some features, such as indicating
	 * support post thumbnails.
	 */
	function fse_tutorial_theme_setup() {
		/**
		 * Add default posts and comments RSS feed links to <head>.
		 */
		add_theme_support( 'automatic-feed-links' );

		/**
		 * Enable support for post thumbnails and featured images.
		 */
		add_theme_support( 'post-thumbnails' );

		add_theme_support( 'editor-styles' );

		add_theme_support( 'wp-block-styles' );
	}
endif;
add_action( 'after_setup_theme', 'fse_tutorial_theme_setup' );

/**
 * Enqueue theme scripts and styles.
 */
function fse_tutorial_theme_scripts() {
	wp_enqueue_style( 'fse-tutorial-style', get_stylesheet_uri() );
}
add_action( 'wp_enqueue_scripts', 'fse_tutorial_theme_scripts' );
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

Before continuing, install and activate your theme.

There are three ways to create templates and template parts:

- Manually, by creating HTML files containing block markup.
- Using the site editor.
- Using the template editing mode in the block editor.

The differences are explained below.

### Manual template creation

Create two template part files called `footer.html` and `header.html` and place them inside the `block-template-parts` folder.

When you add blocks manually to your HTML files, you will start with an HTML comment that includes the block name prefixed with `wp:`.
There are both self-closing and multi-line blocks:

Add the site title to `header.html`:

```html
<!-- wp:site-title /-->
```

Add a credit text to `footer.html`:

```html
<!-- wp:paragraph -->
<p>Proudly powered by <a href="https://wordpress.org/">WordPress</a>.</p>
<!-- /wp:paragraph -->
```

The blocks are self-containing; the opening tag and the closing tag must be in the same template.
You would not be able to place an opening tag for a group block in a header template and close it in a footer template.

Open `index.html` and include the template parts by adding two HTML comments.
The HTML comments start with `wp:template-part`, which is the name of the template part block.
Each template part is identified by the slug, the name of the file without the file ending.

Inside the HTML comment, add two curly brackets and the key, `slug`, together with the name of the template part:

```html
<!-- wp:template-part {"slug":"header"} /-->

<!-- wp:template-part {"slug":"footer"} /-->
```

The template part uses a `<div>` by default. Add the `tagName` attribute to change their HTML element to header and footer:

```html
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
```

All block attributes are placed inside these curly brackets. If you wanted the paragraph in `footer.html` to be centered, you would use the `align` attribute:

```html
<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center">Proudly powered by <a href="https://wordpress.org/">WordPress</a>.</p>
<!-- /wp:paragraph -->
```

The HTML element that wraps the block content also needs to use the corresponding CSS class: `has-text-align-center`.

Tip:
When you are not sure what the correct block markup is, you can add the block in the block editor
and copy the block markup from the code editor mode to your theme files.

### Template creation in the site editor

Open the Site Editor from the WordPress admin menu. The default view is the blank index.html template.

Open the Add block menu and select and place a new template part. The block will have the default name "Untitled Template Part".

Open the advanced section of the block settings sidebar and make the following changes:
Change the title and area to Header, and the HTML element to `<header>`.

Add a site title block to the header template part, and a paragraph to the footer.

Save the changes. You will be asked if you want to save the template part, the index template, or both. Choose both. Repeat the process and add a footer template part.

### Template editing mode

The template editing mode is a way to edit the website without the complexity of the site editor interface.
It is more limited than the site editor because you can not create, select or navigate between templates in this view.

You can access the template editing mode via the block editor.
When the document settings sidebar is open, locate the Template panel below Status & Visibility.
Here you will find information about the current template, and you can create a new blank template or change to an existing template.

### Exporting

Templates and template parts that have been created or edited in the site editor or template editing mode
are saved to the database as custom post types. To export them as theme files, follow these steps:

- In the site editor, open the "More tools and options" menu.
- Select the Export option to download a zip file containing the files. Unzip the files.
- Copy the updated index.html file from theme/block-templates/ to your themes block-templates folder.
- Copy template part one and two from theme/block-template-parts/ to your themes block-template-parts folder.
- Rename the template parts to header.html and footer.html, respectively.
- Open index.html and update the template part slugs in the block markup.

Saved templates have precedence over theme files. To use the updated theme files, go to Appearance > Templates/Template parts and delete the saved templates.

#### Additional templates

##### Blog

Now the theme has a basic site header and footer, but it does not display any content.
To create a blog, a list of the latest posts, you will use the query and query loop blocks.

Wether you are using the site editor or editing theme files directly, open the index template.

First, add a group block that will work as a container for your posts.
Next, enable the width options for the blocks inside this group using `"layout":{"inherit":true}`.
You can read more about the layout setting later in this tutorial.

```html
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
<!-- wp:group {"layout":{"inherit":true}} -->
<div class="wp-block-group"></div>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
```

Change the `<div>` in the group block to a `<main>` element using the `tagName` attribute.
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
<!-- wp:group {"layout":{"inherit":true},"tagName":"main"} -->
<main class="wp-block-group"></main>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->

In the editor, you can change the element from div to main under Advanced in the block setting sidebar.

Add a query block inside the group.
When you place a query block in the editor, the query loop is used as an inner block and you have the option to start with an empty loop or include selected post blocks like a post title and featured image.

Example markup:

```html
<!-- wp:query -->
<div class="wp-block-query"><!-- wp:query-loop -->
<!-- wp:post-title /-->
<!-- wp:post-date /-->
<!-- wp:post-excerpt /-->
<!-- /wp:query-loop --></div>
<!-- /wp:query -->
```

The query pagination block that lets you navigate between pages of posts can only be used inside the query.
It needs to be placed inside the query, but outside the loop:

```html
<!-- wp:query -->
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

When you add the query for the blog, you also want to make sure that the post title block is a link.
Otherwise, you can not reach the single posts from the blog.
The link option can be enabled in the block setting sidebar of the post title block.

The block markup for a post title with the link enabled is: `<!-- wp:post-title {"isLink":true} /-->`

To create a "read more" text link for the post excerpt block, you need to enable the `moreText` option and add a text:
`<!-- wp:post-excerpt {"moreText":"Continue reading"} /-->`

##### Posts and pages

Next, create a new template for displaying single posts.
If you are editing theme files directly, create a file called `single.html` inside the block-templates folder.

Add the site header and site footer template parts:

```html
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
```

Add a group block that will work as a container for your post:

```html
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
<!-- wp:group {"tagName":"main"} -->
<main class="wp-block-group"></main>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
```

Add your preferred blocks inside the group block. Some new blocks that are available are:

- Post content: `<!-- wp:post-content /-->`
- Post title: `<!-- wp:post-title /-->`
- Post author: `<!-- wp:post-author /-->`
- Post date: `<!-- wp:post-date /-->`
- Post featured image: `<!-- wp:post-featured-image /-->`
- Post tags: `<!-- wp:post-terms {"term":"post_tag"} /-->`
- Post categories: `<!-- wp:post-terms {"term":"category"} /-->`
- Next and previous post: `<!-- wp:post-navigation-link /--><!-- wp:post-navigation-link {"type":"previous"} /-->`

Save the HTML file, or save and export the post template if you are working in the site editor.

Copy all the blocks and create a template for displaying pages.
Optionally you can copy the single.html file as page.html inside the block-templates folder.
Adjust the blocks for the page template, and save.

##### Archives

If a theme does not use an archive or search result template, the index template will be used as a fallback.
To make sure that the query block shows the correct results, it has an attribute called `inherit`.
Inherit is enabled by default and filters the query depending on what page you are viewing.

You can continue by creating an archive or category template by copying the index file.
Add a title to the archive page with the archive title block. This is a variation of the query title block:
`<!-- wp:query-title {"type":"archive"} /-->`

## Theme.json - Global styles

`theme.json` is a configuration file used to enable or disable features and set default styles for both the website and blocks.

Style settings are converted to CSS custom properties and enqueued for the editor and the front,
reducing the need for the theme to enqueue block styles.

To make the most out of this tutorial please read the [documentation for global styles](/docs/how-to-guides/themes/theme-json.md).

[Learn more about the JSON format (external link)](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON)

Create a file called `theme.json` and save it inside the main theme folder.

Start by adding two curly brackets to the file:

```json
{

}
```

Add the version number for the theme.json format. For Gutenberg 10.6, the version number is 1:

```json
{
	"version": 1,
}
```

Next, add three main sections:

- Settings -Where you will enable features and create presets for styles.
- Styles -Where you apply styles to the website, elements, and blocks.
- templateParts -For assigning template part files to template areas.

```json
{
	"version": 1,
	"settings": {
	},
	"styles": {
	},
	"templateParts": [
	]
}
```

Remember to separate the objects with a comma.

### Enabling and disabling features

For a list of features that can be enabled or disabled, please see the [documentation for theme.json](https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-json/#settings).

There are two different ways that a block can support a feature:

- By displaying a control in the block settings sidebar.
- By allowing defaults to be set using theme.json.

Note: It is not possible to add controls to a block that does not support them by using theme.json.

Example:
A block that does not have support for border controls, can have a default border set inside the theme.json file,
as long as the border feature is enabled.

To enable border styles, add a `border` object under `settings` with the following attributes and values:

```json
{
	"version": 1,
	"settings": {
		"border": {
			"customColor": true,
			"customRadius": true,
			"customStyle": true,
			"customWidth": true
		}
	}
```

To enable link colors, add a `color` setting and set `link` to true:

```json
{
	"version": 1,
	"settings": {
		"border": {
			"customColor": true,
			"customRadius": true,
			"customStyle": true,
			"customWidth": true
		},
		"color": {
			"link": true,
		}
	}
```

If you wanted to disable gradients, which are enabled by default, you would set `gradient` to false:

```json
{
	"version": 1,
	"settings": {
		"border": {
			"customColor": true,
			"customRadius": true,
			"customStyle": true,
			"customWidth": true
		},
		"color": {
			"link": true,
			"gradient": false
		}
	}
```

To enable padding and custom spacing units, include a setting for spacing:

```json
{
	"version": 1,
	"settings": {
		"border": {
			"customColor": true,
			"customRadius": true,
			"customStyle": true,
			"customWidth": true
		},
		"color": {
			"link": true,
			"gradients": false
		},
		"spacing": {
			"customPadding": true,
			"units": [ "px", "em", "rem", "vh", "vw" ]
		}
	}
```

### Content width and theme support for wide and full-width blocks

This enables the layout setting for group blocks and template parts, and replaces `add_theme_support( 'align-wide' );`.

With this setting, inner blocks can use (inherit) the widths that you set in the theme.json file, or use a custom value
defined by the user.

Add a `layout` option under `settings`. The keys used by layout are:

- `contentSize` Default width for the blocks.
- `wideSize` Wide width.

The example uses pixels, but you can use any valid CSS value and unit.
(The code example is truncated to illustrate where to add the option.)

```json
{
	"version": 1,
	"settings": {
		"layout": {
			"contentSize": "840px",
			"wideSize": "1100px"
		}
	}
}
```

### Color palette

This is the equivalent of `add_theme_support( 'editor-color-palette' )`.
You can add multiple color palettes: a default palette for all blocks, and color palettes specific to a block type.

The keys used by palette are:

- `slug` A unique identifier for the color.
- `color` The hex color value.
- `name` The visible name in the editor.

The name attribute is optional.
You can add mutliple colors as an array using square brackets `[]`.

Inside `settings`, under `color`, add a default color palette:

```json
{
	"version": 1,
	"settings": {
		"color": {
			"palette": [
				{
					"slug": "white",
					"color": "#fff",
					"name": "White"
				},
				{
					"slug": "blue",
					"color": "#0073AA",
					"name": "WordPress blue"
				},
				{
					"slug": "dark-grey",
					"color": "#23282D",
					"name": "Dark grey"
				}
			]
		}
	}
}
```

Next, add a trailing comma after `color`, and add a new palette for the heading block.
This palette will override the default theme palette.

```json
"blocks": {
	"core/heading": {
		"color": {
			"palette": [
				{
					"slug": "white",
					"color": "#fff",
					"name": "White"
				},
				{
					"slug": "medium-blue",
					"color": "#00A0D2",
					"name": "Medium blue"
				}
			]
		}
	}
}
```

Presets are created under `settings` and applied under `styles`.
Apply the white color to the body background by adding `color` followed by the `background` key and value:

```json
"styles": {
	"color": {
		"background": "var(--wp--preset--color--white)"
	}
}
```

### Typography

To add custom font sizes, create a new section called `typography` under `settings`.
`fontSizes` is the equivalent of `add_theme_support( 'editor-font-sizes' )`.

```json
"typograhy": {
	"fontSizes": [
	]
}
```

The keys used by `fontSizes are:

- `slug` A unique identifier for the size.
- `size` The size value. This can be unitless or use any valid CSS value.
- `name` The visible name in the editor.

```json
"typograhy": {
	"fontSizes": [
		{
			"slug": "normal",
			"size": "20px",
			"name": "normal"
		},
		{
			"slug": "extra-small",
			"size": "16px",
			"name": "Extra small"
		},
		{
			"slug": "large",
			"size": "24px",
			"name": "Large"
		}
	]
}
```

And to apply a size to a block, you can follow these steps:
Under `styles`, create a new section called `blocks`:

```json
"blocks": {

}
```

Add the names of the block that you want to set defaults for:

```json
"blocks": {
	"core/paragraph": {
	},
	"core/post-terms": {
	},
	"core/post-title": {
	}
}
```

Add the typography setting, and set the fontSize value to the preset that you created:

```json
"blocks": {
	"core/paragraph": {
		"typography": {
			"fontSize": "var(--wp--preset--font-size--normal)"
		}
	},
	"core/post-terms": {
		"typography": {
			"fontSize": "var(--wp--preset--font-size--extra-small)"
		}
	},
	"core/post-title": {
		"typography": {
			"fontSize": "var(--wp--preset--font-size--large)"
		}
	},
}
```

### Elements

With the `elements` setting, you can set defaults for HTML elements in two different ways:

- Elements on the website
Example: Setting a font color to all `<H2>` headings, regardless of if the heading is a site title, post title, or heading block.

```json
	"styles": {
		"elements": {
			"h2": {
				"color": {
					"text": "var(--wp--preset--color--medium-blue)"
				}
			}
		}
	}
```

Add a default link text color:

```json
	"styles": {
		"elements": {
			"h2": {
				"color": {
					"text": "var(--wp--preset--color--medium-blue)"
				}
			},
			"link": {
				"color": {
					"text": "var(--wp--preset--color--dark-grey)"
				}
			}
		}
	}
```

- Elements inside blocks
Some blocks have more than one element, or have different elements depending on settings.
Example: If you set a background color to a post excerpt block, that background affects the entire block.
You can set a background to the optional "read more" link in the post excerpt block using elements:
`Styles > blocks > the name of the block > elements > element > attribute`

Since we have enabled custom padding, we can add padding within the spacing attribute to make the background color more visible.

```JSON
"styles": {
	"blocks": {
		"core/post-excerpt": {
			"elements": {
				"link": {
					"color": {
						"text": "var(--wp--preset--color--white)",
						"background": "var(--wp--preset--color--blue)"
					},
					"spacing": {
						"padding": {
							"top": "1em",
							"right": "1em",
							"bottom": "1em",
							"left": "1em"
						}
					}
				}
			}
		}
	}
}
```

### Template parts

In the templeParts section, assign the two template parts that you created to their template areas.
Add two keys:
-`name`, the file name of the template part file without the file ending,
-`area`, the name of the template area.

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

The benefit of enabling the layout setting in theme.json is that you no longer need to add extra CSS for the alignments or widths. You can also set more precise widths to blocks inside containers.

The first thing you need to know is that blocks have different options available depending on if you are using the block editor or the site editor.
When you are working in the block editor, your blocks are already placed inside a container.
In the site editor, you can choose to use a container like a group or template part block.

If you place an image block in the canvas of the site editor, it will not have any alignment or width options,
and it will be positioned to the left.

If you place the image block inside a group block, the options depend on the layout settings in the group block.

- Without changes to the layout settings, you can align the image to the left, center, or right.
- When the layout setting inherits the width from theme.json, you can set the image's width to default, wide or full width.
- When the content width and wide width have been specified, the image's width is adjusted and can be set to default, wide or full width.

## Creating custom templates

Custom templates for posts, pages, and custom post types can be created by adding additional HTML files inside the
`block-templates` folder.

In a classic theme, templates are identified with a file header. In a block theme, you list templates in the theme.json file.

All templates that are listed in the customTemplates section of theme.json will be selectable in the site editor.

If you want to assign the template to a post or page in the block editor, the template's file name needs to be prefixed with either post or page.

First, create a section called `customTemplates` at the root level of theme.json.
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
