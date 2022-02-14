# Patterns

Block Patterns are predefined block layouts, available from the patterns tab of the block inserter. Once inserted into content, the blocks are ready for additional or modified content and configuration.

In this Document:
* [`register_block_pattern`](#register_block_pattern)
* [`unregister_block_pattern`](#unregister_block_pattern)
* [`register_block_pattern_category`](#register_block_pattern_category)
* [`unregister_block_pattern_category`](#unregister_block_pattern_category)

## Block Patterns

### register_block_pattern

The editor comes with several core block patterns. Theme and plugin authors can register additional custom block patterns using the `register_block_pattern` helper function.

The `register_block_pattern` helper function receives two arguments. 
-   `title`: A machine-readable title with a naming convention of `namespace/title`.
-	`properties`: An array describing properties of the pattern.

The properties available for block patterns are:

-   `title` (required): A human-readable title for the pattern.
-   `content` (required): Block HTML Markup for the pattern.
-   `description` (optional): A visually hidden text used to describe the pattern in the inserter. A description is optional but it is strongly encouraged when the title does not fully describe what the pattern does. The description will help users discover the pattern while searching.
-   `categories` (optional): An array of registered pattern categories used to group block patterns. Block patterns can be shown on multiple categories. A category must be registered separately in order to be used here.
-   `keywords` (optional): An array of aliases or keywords that help users discover the pattern while searching.
-   `viewportWidth` (optional): An integer specifying the intended width of the pattern to allow for a scaled preview of the pattern in the inserter.
-   `blockTypes` (optional): An array of block types that the pattern is intended to be used with.

The following code sample registers a block pattern named 'my-plugin/my-awesome-pattern':

```php
register_block_pattern(
	'my-plugin/my-awesome-pattern',
	array(
		'title'       => __( 'Two buttons', 'my-plugin' ),
		'description' => _x( 'Two horizontal buttons, the left button is filled in, and the right button is outlined.', 'Block pattern description', 'my-plugin' ),
		'content'     => "<!-- wp:buttons {\"align\":\"center\"} -->\n<div class=\"wp-block-buttons aligncenter\"><!-- wp:button {\"backgroundColor\":\"very-dark-gray\",\"borderRadius\":0} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-background has-very-dark-gray-background-color no-border-radius\">" . esc_html__( 'Button One', 'my-plugin' ) . "</a></div>\n<!-- /wp:button -->\n\n<!-- wp:button {\"textColor\":\"very-dark-gray\",\"borderRadius\":0,\"className\":\"is-style-outline\"} -->\n<div class=\"wp-block-button is-style-outline\"><a class=\"wp-block-button__link has-text-color has-very-dark-gray-color no-border-radius\">" . esc_html__( 'Button Two', 'my-plugin' ) . "</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->",
	)
); 
```

_Note:_ 

`register_block_pattern()` should be called from a handler attached to the init hook.

```php
function my_plugin_register_my_patterns() {
  register_block_pattern( ... );
}
 
add_action( 'init', 'my_plugin_register_my_patterns' );
```

## Unregistering Block Patterns

### unregister_block_pattern

The `unregister_block_pattern` helper function allows for a previously registered block pattern to be unregistered from a theme or plugin and receives one argument. 
-   `title`: The name of the block pattern to be unregistered.

The following code sample unregisters the block pattern named 'my-plugin/my-awesome-pattern':

```php
unregister_block_pattern( 'my-plugin/my-awesome-pattern' );
```

_Note:_ 

`unregister_block_pattern()` should be called from a handler attached to the init hook.

```php
function my_plugin_unregister_my_patterns() {
  unregister_block_pattern( ... );
}
 
add_action( 'init', 'my_plugin_unregister_my_patterns' );
```

## Block Pattern Categories

Block patterns can be grouped using categories. The block editor comes with bundled categories you can use on your custom block patterns. You can also register your own block pattern categories.

### register_block_pattern_category

The `register_block_pattern_category` helper function receives two arguments. 
-   `title`: A machine-readable title for the block pattern category.
-	`properties`: An array describing properties of the pattern category.

The properties of the pattern categories include:

-   `label` (required): A human-readable label for the pattern category.

The following code sample registers the category named 'hero':

```php
register_block_pattern_category(
	'hero',
	array( 'label' => __( 'Hero', 'my-plugin' ) )
);
```

_Note:_ 

`register_block_pattern_category()` should be called from a handler attached to the init hook.

```php
function my_plugin_register_my_pattern_categories() {
  register_block_pattern_category( ... );
}
 
add_action( 'init', 'my_plugin_register_my_pattern_categories' );
```

### unregister_block_pattern_category

`unregister_block_pattern_category` allows unregistering a pattern category.

The `unregister_block_pattern_category` helper function allows for a previously registered block pattern category to be unregistered from a theme or plugin and receives one argument. 
-   `title`: The name of the block pattern category to be unregistered.

The following code sample unregisters the category named 'hero':

```php
unregister_block_pattern_category( 'hero' );
```

_Note:_ 

`unregister_block_pattern_category()` should be called from a handler attached to the init hook.

```php
function my_plugin_unregister_my_pattern_categories() {
  unregister_block_pattern_category( ... );
}
 
add_action( 'init', 'my_plugin_unregister_my_pattern_categories' );
```

## Block patterns contextual to block types

It is possible to attach a block pattern to one or multiple block types. This makes the block pattern as an available transform for that block type.

For instance:

```php
register_block_pattern(
	'my-plugin/powered-by-wordpress',
	array(
		'title'      => __( 'Powered by WordPress', 'my-plugin' ),
		'blockTypes' => array( 'core/paragraph' ),
		'content'    => '<!-- wp:paragraph -->
		<p>Powered by WordPress</p>
		<!-- /wp:paragraph -->
		',
	)
);
```

The above code registers a block pattern named 'my-plugin/powered-by-wordpress' and also shows the pattern in the "transform menu" of paragraph blocks.

Blocks can also use these contextual block patterns in other places. For instance, when inserting a new Query Loop block, the user is provided with a list of all patterns attached to the block.

## Semantic block patterns

In block themes, you can also mark block patterns as "header" or "footer" patterns (template part areas). We call these "semantic block patterns". These patterns are shown to the user when inserting or replacing header or footer template parts.

Example:

```php
<?php
register_block_pattern(
	'my-plugin/my-header',
	array(
		'title'      => __( 'My Header', 'my-plugin' ),
		'categories' => array( 'header' ),
		// Assigning the pattern the "header" area.
		'blockTypes' => array( 'core/template-part/header' ),
		'content'    => 'Content of my block pattern',
	)
);
```
