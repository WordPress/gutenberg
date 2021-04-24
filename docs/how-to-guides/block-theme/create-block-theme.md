# Create a block theme

The purpose of this tutorial is to show how to create a block theme and help theme developers transition to full site editing.

You will learn about the required files, how to combine templates and template parts, how to add presets for global styles, and how to add blocks and export the templates in the site editor.

Full site editing is an experimental feature and the workflow in this tutorial is likely to change.

This tutorial is up to date as of Gutenberg version 9.1.

## Table of Contents

1.  [What is needed to create a block-theme?](/docs/how-to-guides/block-theme/README.md#what-is-needed-to-create-a-block-theme)
2.  [Creating the theme](/docs/how-to-guides/block-theme/README.md#creating-the-theme)
3.  [Creating the templates and template parts](/docs/how-to-guides/block-theme/README.md#creating-the-templates-and-template-parts)
4.  [experimental-theme.json - Global styles](/docs/how-to-guides/block-theme/README.md#experimental-theme-json-global-styles)

## What is needed to create a block theme?

To use a block theme you need to use the Gutenberg plugin.

A block theme is built using HTML templates and template parts. Templates are the main files used in the [template hierarchy](https://developer.wordpress.org/themes/basics/template-hierarchy/), for example index, single or archive. Templates can optionally include structural template parts, for example a header, footer or sidebar.

Each template or template part contains the [block grammar](https://developer.wordpress.org/block-editor/principles/key-concepts/#blocks), the HTML, for the selected blocks. The block HTML is generated in and exported from the **site editor**. It can also be added to the theme's HTML files manually.

### Required files and file structure

A block theme requires an `index.php` file, an index template file, a `style.css` file, and a `functions.php` file.

The theme may optionally include an [experimental-theme.json file](/docs/how-to-guides/themes/theme-json.md) to manage global styles. You decide what additional templates and template parts to include in your theme.

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
Tested up to: 5.4
Requires PHP: 7.0
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: myfirsttheme

This theme, like WordPress, is licensed under the GPL.
Use it to make something cool, have fun, and share what you've learned with others.
*/
```

Create a `functions.php` file.

In this file, you will enqueue the `style.css` file and add any theme support that you want to use. For example colors, wide blocks and featured images.

_You no longer need to add theme support for the title tag. It is already enabled with full site editing._

https://developer.wordpress.org/themes/basics/theme-functions/#what-is-functions-php

https://developer.wordpress.org/block-editor/developers/themes/theme-support/

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

	add_theme_support( 'editor-color-palette', array(
		array(
			'name' => __( 'strong magenta', 'myfirsttheme' ),
			'slug' => 'strong-magenta',
			'color' => '#a156b4',
		),
		array(
			'name' => __( 'very dark gray', 'myfirsttheme' ),
			'slug' => 'very-dark-gray',
			'color' => '#444',
		),
	) );

	add_theme_support( 'wp-block-styles' );

	add_theme_support( 'align-wide' );
}
endif; // myfirsttheme_setup
add_action( 'after_setup_theme', 'myfirsttheme_setup' );

/**
 * Enqueue theme scripts and styles.
 */
function myfirsttheme_scripts() {
	wp_enqueue_style( 'myfirsttheme-style', get_stylesheet_uri() );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'myfirsttheme_scripts' );
```

Create an `index.php` file.
This file is used as a fallback if the theme is activated when full site editing is not enabled.
You may leave the file empty for this tutorial.

Your theme should now include the following files and folders:

```
theme
 |__ style.css
 |__ functions.php
 |__ index.php
 |__ block-templates
 	|__ (empty folder)
 |__ block-template-parts
 	|__ (empty folder)
```

### Creating the templates and template parts

Create two template parts called `footer.html` and `header.html` and place them inside the `block-template-parts` folder. You can leave the files empty for now.

Inside the block-templates folder, create an `index.html` file.

In `index.html`, include the template parts by adding two HTML comments.

The HTML comments starts with `wp:template-part` which is the name of the template-part block type. Inside the curly brackets are two keys and their values: The slug of the template part, and the theme text domain.

```
<!-- wp:template-part {"slug":"header","theme":"myfirsttheme"} /-->

<!-- wp:template-part {"slug":"footer","theme":"myfirsttheme"} /-->
```

If you used a different theme name, adjust the value for the theme text domain.

Eventually, you will be able to create and combine templates and template parts directly in the site editor.

### Experimental-theme.json - Global styles

The purpose of the `experimental-theme.json` file is to make it easier to style blocks by setting defaults.

It is used to:

-   Create CSS variables (also called CSS custom properties) that can be used to style blocks both on the front and in the editor.
-   Set global styles.
-   Set styles for individual block types.

[The documentation for global styles contains a list of available block and style combinations.](https://developer.wordpress.org/block-editor/developers/themes/theme-json/)

Create a file called `experimental-theme.json` and save it inside the main folder.

CSS variables are generated using **Global presets**. The variables are added to the `:root` on the front, and to the `.editor-styles-wrapper` class in the editor.

Styles that are added to the themes `style.css` file or an editor style sheet are loaded after global styles.

Add the following global presets to the `experimental-theme.json` file:

```
{
	"global": {
		"settings": {
			"color": {
				"palette": [
					{
						"slug": "strong-magenta",
						"color": "#a156b4"
					},
					{
						"slug": "very-dark-gray",
						"color": "#444"
					},
				]
			},
			"custom": {
				"line-height": [
					{
						"small": "1.3"
					},
					{
						"medium": "2"
					},
					{
						"large": "2.5"
					}
				]
			}
		}
	}
}
```

This code generates the following variables:

```
	--wp--preset--color--strong-magenta: #a156b4;
	--wp--preset--color--very-dark-gray: #444;

	--wp--custom--line-height--small: 1.3;
	--wp--custom--line-height--medium: 2;
	--wp--custom--line-height--large: 2.5;
```

**Global styles** are used to set default values for the website and for the blocks.

This example will add the dark grey color as the website background color.
Add the code inside the globals, after the presets:

```
	"styles": {
		"color": {
			"background": "var(--wp--preset--color--very-dark-gray)"
		}
	}
```

**Block styles** sets default values for all blocks of a specific type.

This example uses the CSS variables to add text color and line height to the H2 heading block,
in combination with a custom font size.

When adding styles for the headings block, include the heading level, h1 to h6.

Block styles are separate from global styles. Add the code after the globals, but before the closing brace.

```
"core/heading/h2": {
	"styles": {
		"color": {
			"text": "var( --wp--preset--color--strong-magenta )"
		},
		"typography": {
			"fontSize": "2.5rem",
			"lineHeight": "var(--wp--custom--line-height--medium)"
		}
	}
},
```

CSS variables for font sizes are generated using the `editor-font-sizes` theme support or by adding a global preset.

https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-font-sizes

If the theme does not add any custom font sizes, variables are created using the default sizes.
This example adds the default medium font size to the paragraph block.

The font sizes are unitless, which is why calc is used: https://developer.mozilla.org/en-US/docs/Web/CSS/calc

```
"core/paragraph": {
	"styles": {
		"typography": {
			"fontSize": "calc(1px * var( --wp--preset--font-size--medium ))"
		}
	}
},
```

Using the CSS variables is optional. In this example, the default background color for the group block is changed to white using a color code:

```
"core/group": {
	"styles": {
		"color": {
			"background": "#ffffff"
		}
	}
}
```

Below are the presets and styles combined:

```
{
	"global": {
		"settings": {
			"color": {
				"palette": [
					{
						"slug": "strong-magenta",
						"color": "#a156b4"
					},
					{
						"slug": "very-dark-gray",
						"color": "#444"
					},
				]
			},
			"custom": {
				"line-height": [
					{
						"small": "1.3"
					},
					{
						"medium": "2"
					},
					{
						"large": "2.5"
					}
				]
			}
		}
	},

	"core/heading/h2": {
		"styles": {
			"color": {
				"text": "var( --wp--preset--color--strong-magenta )"
			},
			"typography": {
				"fontSize": "2.5rem",
				"lineHeight": "var(--wp--custom--line-height--medium)"
			}
		}
	},

	"core/paragraph": {
		"styles": {
			"typography": {
				"fontSize": "calc(1px * var( --wp--preset--font-size--medium ))"
			}
		}
	},

	"core/group": {
		"styles": {
			"color": {
				"background": "#ffffff"
			}
		}
	}
}
```

