# How to create a Block Pattern

## Overview

Patterns are collections of pre-arranged blocks that can be combined and arranged in many ways, making it easier to create beautiful content. They act as a head-start, leaving you to plug and play with your content as you see fit and be as simple as single blocks or as complex as a full-page layout.

## Before you start

To complete this tutorial, you will need the following:

-   WordPress development environment
-   Familiarity with Plugins and Gutenberg

## Step-by-step guide

### Step 1: Create a sample plugin

Create a directory named `my-block-pattern` and place it under the plugins folder. Create a file called `my-block-pattern.php` inside the folder you just created and paste the following code:

```php
<?php
/*
Plugin Name: Quote Pattern Example Plugin
*/
register_block_pattern(
	'my-block-pattern/my-block-pattern',
	array(
		'title'       => __( 'Quote with Avatar', 'my-block-pattern' ),
		'categories'  => array( 'text' ),
		'description' => _x( 'A big quote with an avatar".', 'Block pattern description', 'my-block-pattern' ),
		'content'     => '<!-- wp:group --><div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:separator {"className":"is-style-default"} --><hr class="wp-block-separator is-style-default"/><!-- /wp:separator --><!-- wp:image {"align":"center","id":553,"width":150,"height":150,"sizeSlug":"large","linkDestination":"none","className":"is-style-rounded"} --><div class="wp-block-image is-style-rounded"><figure class="aligncenter size-large is-resized"><img src="https://blockpatterndesigns.mystagingwebsite.com/wp-content/uploads/2021/02/StockSnap_HQR8BJFZID-1.jpg" alt="" class="wp-image-553" width="150" height="150"/></figure></div><!-- /wp:image --><!-- wp:quote {"align":"center","className":"is-style-large"} --><blockquote class="wp-block-quote has-text-align-center is-style-large"><p>"Contributing makes me feel like I\'m being useful to the planet."</p><cite>— Anna Wong, <em>Volunteer</em></cite></blockquote><!-- /wp:quote --><!-- wp:separator {"className":"is-style-default"} --><hr class="wp-block-separator is-style-default"/><!-- /wp:separator --></div></div><!-- /wp:group -->',
	)
);
?>
```

### Step 2: Activate the plugin

Go to the plugins section in the WordPress admin and activate `Quote Pattern Example Plugin`

### Step 3: Use the block pattern

Open a new post and click on the Patterns tab. Select the `text` category. Your pattern should be displayed and ready to be used.

## Troubleshooting

-   If the pattern does not appear in the panel, make sure that the plugin is activated and that you're browsing the correct category.

## Conclusion

Creating a block pattern is an efficient way to organize blocks. In this tutorial you have created a pattern that can be reused in any post.

If you want to learn more about block patterns, you may want to check the [Block Editor Handbook](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-patterns/)

<!--
This documentation is based on templates from The Good Docs Project.
This comment can be removed in your guide.
-->
