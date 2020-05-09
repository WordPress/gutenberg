# Patterns (Experimental)

Patterns are predefined block layouts, ready to insert and tweak. 

**Note** Patterns are still under heavy development and the APIs are subject to change.

#### register_block_pattern

The editor comes with a list of built-in patterns. Theme and plugin authors can register addition custom patterns using the `register_block_pattern` function.

The `register_block_pattern` function receives the name of the pattern as the first argument and an array describing properties of the pattern as the second argument.

The properties of the style array must include `name` and `label`: 
 - `title`: A human-readable title for the pattern.
 - `content`: Raw HTML content for the pattern.

```php
register_block_pattern(
    'my-plugin/my-awesome-pattern',
    array(
		'title'   => __( 'Two buttons', 'my-plugin' ),
        'content' => "<!-- wp:buttons {\"align\":\"center\"} -->\n<div class=\"wp-block-buttons aligncenter\"><!-- wp:button {\"backgroundColor\":\"very-dark-gray\",\"borderRadius\":0} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-background has-very-dark-gray-background-color no-border-radius\">" . esc_html__( 'Button One', 'my-plugin' ) . "</a></div>\n<!-- /wp:button -->\n\n<!-- wp:button {\"textColor\":\"very-dark-gray\",\"borderRadius\":0,\"className\":\"is-style-outline\"} -->\n<div class=\"wp-block-button is-style-outline\"><a class=\"wp-block-button__link has-text-color has-very-dark-gray-color no-border-radius\">" . esc_html__( 'Button Two', 'my-plugin' ) . "</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->",
    )
);
```

#### unregister_block_pattern

`unregister_block_pattern` allows unregistering a pattern previously registered on the server using `register_block_pattern`.

The function's argument is the registered name of the pattern.

The following code sample unregisters the style named 'my-plugin/my-awesome-pattern':

```php
unregister_block_pattern( 'my-plugin/my-awesome-pattern' );
```
