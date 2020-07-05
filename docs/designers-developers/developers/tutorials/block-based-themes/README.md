# Creating a block-based theme

The purpose of this tutorial is to show how to create a basic block based theme
and help theme developers transition to full site editing.

Please also see the documentation for block-based themes at https://developer.wordpress.org/block-editor/developers/themes/block-based-themes/

## What is needed to create a block-based theme?

To use a block based theme you need to have Gutenberg installed and full site editing must be enabled.

Full site editing can be enabled from the Gutenberg experiments menu in the WordPress admin area.

This tutorial was written for Gutenberg version 8.4.

A block-based theme is built using templates and template parts.

Templates are your main files according to the [template hierarchy](https://developer.wordpress.org/themes/basics/template-hierarchy/), 
for example index, single or archive.

Templates can optionally include template parts, for example header, footer or a sidebar.

A block based theme requires an index.php file, and index template, a style.css file, and a functions.php file.

You decide what additional templates and template parts to include in your theme.

Templates are placed inside the block-templates folder, 
and template parts are placed inside the block-template-parts folder.

```
theme
|__ style.css
|__ functions.php
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

Each template or template part contains the [block grammar](https://developer.wordpress.org/block-editor/principles/key-concepts/#blocks), the raw HTML, for the selected blocks.

## Creating the theme

Create a new folder for your theme.
Inside this folder, create the block-templates and block-template-parts folders.

Create a style.css file.
The file header is identical to the style.css file you would use in a traditional theme.

```
/*
Theme Name: Twenty Twenty
Theme URI: https://wordpress.org/themes/twentytwenty/
Author: the WordPress team
Author URI: https://wordpress.org/
Description: 
Tags:
Version: 1.3
Requires at least: 5.0
Tested up to: 5.4
Requires PHP: 7.0
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: twentytwenty
This theme, like WordPress, is licensed under the GPL.
Use it to make something cool, have fun, and share what you've learned with others.
*/
```

Create a functions.php file.

In this file, you will enqueue the style.css file and add the menus and theme support that you want to use.

For example colors, wide blocks and featured images.

-You no longer need to add theme support for the title tag. This is already enabled with full site editing.

```
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
 
	/**
	 * Add support for two custom navigation menus.
	 */
	register_nav_menus( array(
		'primary'   => __( 'Primary Menu', 'myfirsttheme' ),
		'secondary' => __('Secondary Menu', 'myfirsttheme' )
	) );

}
endif; // myfirsttheme_setup
add_action( 'after_setup_theme', 'myfirsttheme_setup' );

function myfirsttheme_scripts() {
	wp_enqueue_style( 'myfirsttheme-style', get_stylesheet_uri() );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'myfirsttheme_scripts' );
```

### Create the Index template

WordPress requires themes to include an index.php file.
This file is used as a fallback if the theme is activated when full site editing is not enabled.
Create an empty index.php file inside your main folder.

Inside the block-template folder, create an empty index.html file.

### Experimental-theme.json -Global styles

The purpose of the experimental-theme.json is to make it easier to style blocks.

It is used to:
 * Create global CSS variables that are used both on the front and in the editor.
 * Set global styles.
 * Set styles for individual block types.

[The documentation for global styles contains a list of available block and style combinations.](https://developer.wordpress.org/block-editor/developers/themes/theme-json/)

Create a file called experimental-theme.json and save it inside the main folder.

We generate the CSS variables using global presets:
```
{
	"global": {
		"presets": {
			"color": [
				{
					"slug": "strong-magenta",
					"value": "#a156b4"
				},
				{
					"slug": "very-dark-gray",
					"value": "#444"
				},
			],
			"line-height": [
				{
					"slug": "small",
					"value": "1.3"
				},
				{
					"slug": "medium",
					"value": "2"
				},
				{
					"slug": "large",
					"value": "2.5"
				}
			],
		},
	},
```

Now we can use the presets with the global styles.
This example will add the dark grey color as the site background color.
Add the code inside the globals, after the preset:
```
	"styles": {
		"color": {
			"background": "var(--wp--preset--color--very-dark-gray)"
		}
	}
```
Next we are styling the H2 heading block using the CSS variables for text color and line height,
combining it with a custom font size.

We are also updating the font size of the paragraph block.
The font size used here is a default size already available as an option in the block editor.

If we don't add a custom font size using theme support, the default CSS variables are created for us,
ready to use.

The font sizes are unit less, which is why we are using calc.

Finally, we add a default background color to the group block.
This is to illustrate that we can use either CSS variables or color codes.

Add this code below the global presets, but before the closing brace:
```
	"core/heading/h2": {
		"styles": {
			"color": {
				"text": "var( --wp--preset--color--strong-magenta )"
			},
			"typography": {
				"fontSize": "2.5rem",
				"lineHeight": "var(--wp--preset--line-height--medium)"
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
```

Below are our presets and styles combined:
```
{
	"global": {
		"presets": {
			"color": [
				{
					"slug": "strong-magenta",
					"value": "#a156b4"
				},
				{
					"slug": "very-dark-gray",
					"value": "#444"
				}
			],
			"line-height": [
				{
					"slug": "small",
					"value": "1.3"
				},
				{
					"slug": "medium",
					"value": "2"
				},
				{
					"slug": "large",
					"value": "2.5"
				}
			]
		},
		"styles": {
			"color": {
				"background": "var(--wp--preset--color--very-dark-gray)"
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
				"lineHeight": "var(--wp--preset--line-height--medium)"
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
