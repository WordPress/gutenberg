# Block Hooks

Block Hooks allow a block to be automatically inserted relative to another block, called the anchor block. They provide a block-based extensibility mechanism for block themes, similar in spirit to how classic themes are often extended with actions and filters.

For example, a plugin can insert a shopping cart block as the last child of every Navigation block, or insert a like button after the Post Content block. The hooked block appears on the front end and in the Site Editor so users can keep, remove, customize, or move it.

Block Hooks were introduced in WordPress 6.4 and expanded in WordPress 6.5 to support modified layouts, Navigation blocks, and filters for customizing the inserted block.

## When to use Block Hooks

Use Block Hooks when a block should appear automatically in a theme layout without requiring the user to insert it manually. Common examples include:

-   Inserting a plugin block before or after a theme block.
-   Adding a block as the first or last child of a container block.
-   Extending Navigation, template, template part, or pattern layouts in a way that remains editable by users.

Block Hooks are intended for layout-level insertion. They work with templates, template parts, patterns, and Navigation blocks. They are not a general-purpose API for inserting arbitrary markup or for modifying regular post content.

Block Hooks also respect user intent. If a user removes, moves, or customizes a hooked block in the Site Editor, WordPress stores that decision and does not simply reinsert the block back into its original position.

## Defining hooks in block.json

The simplest way to define a hook is with the `blockHooks` property in a block's `block.json` file. This is best when the block should be inserted unconditionally for every matching anchor block.

```json
{
	"name": "my-plugin/shopping-cart",
	"blockHooks": {
		"core/navigation": "lastChild"
	}
}
```

The object key is the anchor block name. The object value is the position where the hooked block should be inserted.

The supported `blockHooks` position values are:

-   `before` - insert before the anchor block.
-   `after` - insert after the anchor block.
-   `firstChild` - insert before the first inner block of the anchor block.
-   `lastChild` - insert after the last inner block of the anchor block.

`blockHooks` entries in `block.json` are unconditional. If you need to insert a block only in specific templates, template parts, patterns, or navigation menus, use the `hooked_block_types` filter instead.

## Defining hooks with hooked_block_types

The `hooked_block_types` filter lets you add hooked blocks in PHP. It is useful when insertion depends on context, such as the current template, template part area, pattern, or Navigation block.

```php
function my_plugin_hook_shopping_cart_block( $hooked_block_types, $relative_position, $anchor_block_type, $context ) {
	if ( 'core/navigation' !== $anchor_block_type || 'last_child' !== $relative_position ) {
		return $hooked_block_types;
	}

	if ( ! $context instanceof WP_Post || 'wp_navigation' !== $context->post_type ) {
		return $hooked_block_types;
	}

	if ( str_contains( $context->post_content, '<!-- wp:my-plugin/shopping-cart' ) ) {
		return $hooked_block_types;
	}

	$hooked_block_types[] = 'my-plugin/shopping-cart';

	return $hooked_block_types;
}
add_filter( 'hooked_block_types', 'my_plugin_hook_shopping_cart_block', 10, 4 );
```

The callback receives:

-   `$hooked_block_types` - an array of hooked block type names.
-   `$relative_position` - the current relative position: `before`, `after`, `first_child`, or `last_child`.
-   `$anchor_block_type` - the anchor block type name.
-   `$context` - the template, template part, pattern, or Navigation menu where the anchor block appears.

The position values use camel case in `block.json` (`firstChild`, `lastChild`) and snake case in PHP filters (`first_child`, `last_child`).

The `$context` value can be a `WP_Block_Template` object for templates and template parts, a `WP_Post` object for Navigation menus, or an array for patterns. Check the context type before reading properties that only exist for one kind of context.

## Modifying hooked blocks

The `hooked_block` filter and the block-specific `hooked_block_{$hooked_block_type}` filter allow modifying a hooked block before it is inserted. These filters are available since WordPress 6.5. Use them when you need to set attributes, add inner blocks, wrap a hooked block in another block, or suppress insertion.

```php
function my_plugin_customize_hooked_block( $parsed_hooked_block, $hooked_block_type ) {
	if ( 'my-plugin/shopping-cart' !== $hooked_block_type ) {
		return $parsed_hooked_block;
	}

	if ( null === $parsed_hooked_block ) {
		return null;
	}

	$parsed_hooked_block['attrs']['showIcon'] = true;

	return $parsed_hooked_block;
}
add_filter( 'hooked_block', 'my_plugin_customize_hooked_block', 10, 2 );
```

The parsed block array includes the block name, attributes, inner blocks, and inner content. Returning `null` suppresses insertion of the hooked block.

When possible, prefer sensible default block attributes so the block works well when inserted automatically. Use the `hooked_block` filters for cases where the hooked block needs context-specific configuration.

## User control in the Site Editor

Hooked blocks are automatically inserted, but they are still user-editable. The Site Editor lets users see hooked blocks in context and decide whether to keep, remove, move, or customize them.

This behavior is central to the Block Hooks API. A plugin can provide a useful default layout when activated, while the user's choices remain authoritative after they edit and save a template, template part, pattern, or navigation menu.

## Related resources

-   [`blockHooks` in block registration](/docs/reference-guides/block-api/block-registration.md#blockhooks-optional)
-   [`blockHooks` in block metadata](/docs/reference-guides/block-api/block-metadata.md#block-hooks)
-   [Exploring the Block Hooks API in WordPress 6.5](https://developer.wordpress.org/news/2024/03/25/exploring-the-block-hooks-api-in-wordpress-6-5/)
-   [Introducing Block Hooks for dynamic blocks](https://make.wordpress.org/core/2023/10/15/introducing-block-hooks-for-dynamic-blocks/)
-   [Updates to Block Hooks in 6.5](https://make.wordpress.org/core/2024/03/04/updates-to-block-hooks-in-6-5/)
