# Patterns

Block Patterns are predefined block layouts, ready to insert and tweak.

## Block Patterns Registration

### register_block_pattern

The editor comes with a list of built-in block patterns. Theme and plugin authors can register addition custom block patterns using the `register_block_pattern` function.

The `register_block_pattern` function receives the name of the pattern as the first argument and an array describing properties of the pattern as the second argument.

The properties of the block pattern include:

-   `title` (required): A human-readable title for the pattern.
-   `content` (required): Raw HTML content for the pattern.
-   `description`: A visually hidden text used to describe the pattern in the inserter. A description is optional but it is strongly encouraged when the title does not fully describe what the pattern does.
-   `categories`: An array of pattern categories used to group block patterns. Block patterns can be shown on multiple categories.
-   `keywords`: An array of aliases or keywords that help users discover the pattern while searching.
-   `viewportWidth`: An integer specifying the width of the pattern in the inserter.

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

### unregister_block_pattern

`unregister_block_pattern` allows unregistering a pattern previously registered on the server using `register_block_pattern`.

The function's argument is the registered name of the pattern.

The following code sample unregisters the style named 'my-plugin/my-awesome-pattern':

```php
unregister_block_pattern( 'my-plugin/my-awesome-pattern' );
```

## Block Pattern Categories

Block patterns can be grouped using categories. The block editor comes with bundled categories you can use on your custom block patterns. You can also register your own pattern categories.

### register_block_pattern_category

The `register_block_pattern_category` function receives the name of the category as the first argument and an array describing properties of the category as the second argument.

The properties of the pattern categories include:

-   `label` (required): A human-readable label for the pattern category.

```php
register_block_pattern_category(
	'hero',
	array( 'label' => __( 'Hero', 'my-plugin' ) )
);
```

### unregister_block_pattern_category

`unregister_block_pattern_category` allows unregistering a pattern category.

The function's argument is the name of the pattern category to unregister.

The following code sample unregisters the category named 'hero':

```php
unregister_block_pattern_category( 'hero' );
```
