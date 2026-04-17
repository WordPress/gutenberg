<?php
/**
 * Tab List Block
 *
 * @package WordPress
 */

/**
 * Render callback for core/tab-list.
 *
 * Re-renders each tab inner block with per-item context (index, id,
 * label) injected from the tabs-list, so the tab render callback
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
function block_core_tab_list_render_callback( array $attributes, string $content, \WP_Block $block ): string {
	$tabs_list = $block->context['core/tabs-list'] ?? array();

	if ( empty( $tabs_list ) ) {
		return $content;
	}

	// Re-render each tab with per-item context (index, id, label).
	// Match by position so items align with their corresponding tabs.
	$buttons_html       = '';
	$menu_item_position = 0;

	foreach ( $block->parsed_block['innerBlocks'] ?? array() as $parsed_menu_item ) {
		if ( 'core/tab' !== ( $parsed_menu_item['blockName'] ?? '' ) ) {
			continue;
		}

		$tab       = $tabs_list[ $menu_item_position ] ?? null;
		$tab_index = $menu_item_position;
		++$menu_item_position;

		// Skip menu items with no matching tab.
		if ( null === $tab ) {
			continue;
		}

		$item_context = array_merge(
			$block->context,
			array(
				'core/tab-index' => $tab_index,
				'core/tab-id'    => $tab['id'] ?? '',
				'core/tab-label' => $tab['label'] ?? '',
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
 * Registers the `core/tab-list` block on the server.
 *
 * @since 7.0.0
 */
function register_block_core_tab_list() {
	register_block_type_from_metadata(
		__DIR__ . '/tab-list',
		array(
			'render_callback' => 'block_core_tab_list_render_callback',
		)
	);
}
add_action( 'init', 'register_block_core_tab_list' );
