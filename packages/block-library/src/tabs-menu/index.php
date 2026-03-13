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
	// Match by anchor so the correct tab is found even when the two lists
	// are in different orders.
	$buttons_html = '';

	foreach ( $block->parsed_block['innerBlocks'] ?? array() as $parsed_menu_item ) {
		if ( 'core/tabs-menu-item' !== ( $parsed_menu_item['blockName'] ?? '' ) ) {
			continue;
		}

		// Find the tab anchor from the menu item anchor (e.g. "tab-1-button" → "tab-1").
		$menu_item_anchor = $parsed_menu_item['attrs']['anchor'] ?? '';
		$tab_anchor       = preg_replace( '/-button$/', '', $menu_item_anchor );

		// Find the matching tab in $tabs_list by id.
		$tab       = null;
		$tab_index = 0;
		foreach ( $tabs_list as $index => $candidate ) {
			if ( ( $candidate['id'] ?? '' ) === $tab_anchor ) {
				$tab       = $candidate;
				$tab_index = $index;
				break;
			}
		}

		// Skip menu items with no matching tab.
		if ( null === $tab ) {
			continue;
		}

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
	}

	// Rebuild the wrapper using get_block_wrapper_attributes().
	$wrapper_attributes = get_block_wrapper_attributes( array( 'role' => 'tablist' ) );
	return sprintf( '<div %s>%s</div>', $wrapper_attributes, $buttons_html );
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
