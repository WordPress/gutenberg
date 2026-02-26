<?php
/**
 * Tabs Menu Block
 *
 * @package WordPress
 */

/**
 * Render callback for core/tabs-menu.
 *
 * Re-renders each tabs-menu-item inner block with per-item context (index, id,
 * label) injected from the tabs-list, so the tabs-menu-item render callback
 * can add the correct IAPI directives for each button.
 *
 * @since 7.0.0
 *
 * @param array     $attributes Block attributes.
 * @param string    $content    Block content (rendered inner blocks from save.js).
 * @param \WP_Block $block      WP_Block instance.
 *
 * @return string Updated HTML.
 */
function block_core_tabs_menu_render_callback( array $attributes, string $content, \WP_Block $block ): string {
	$tabs_list = $block->context['core/tabs-list'] ?? array();

	if ( empty( $tabs_list ) ) {
		return $content;
	}

	// Re-render each tabs-menu-item with per-item context (index, id, label).
	$tab_index    = 0;
	$buttons_html = '';

	foreach ( $block->parsed_block['innerBlocks'] ?? array() as $parsed_menu_item ) {
		if ( 'core/tabs-menu-item' !== ( $parsed_menu_item['blockName'] ?? '' ) ) {
			continue;
		}

		if ( $tab_index >= count( $tabs_list ) ) {
			break;
		}

		$tab = $tabs_list[ $tab_index ];

		$item_context = array_merge(
			$block->context,
			array(
				'core/tabs-menu-item-index' => $tab_index,
				'core/tabs-menu-item-id'    => $tab['id'] ?? '',
				'core/tabs-menu-item-label' => $tab['label'] ?? '',
			)
		);

		$menu_item_block = new WP_Block( $parsed_menu_item, $item_context );
		$buttons_html   .= $menu_item_block->render();

		++$tab_index;
	}

	// Replace the saved inner block HTML with the re-rendered buttons.
	$result = preg_replace(
		'/(<div\b[^>]*\bwp-block-tabs-menu\b[^>]*>).*?(<\/div>)/s',
		'$1' . $buttons_html . '$2',
		$content
	);

	return $result ?? $content;
}

/**
 * Registers the `core/tabs-menu` block on the server.
 *
 * @since 7.0.0
 */
function register_block_core_tabs_menu() {
	register_block_type_from_metadata(
		__DIR__ . '/tabs-menu',
		array(
			'render_callback' => 'block_core_tabs_menu_render_callback',
		)
	);
}
add_action( 'init', 'register_block_core_tabs_menu' );
