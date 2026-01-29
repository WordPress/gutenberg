<?php
/**
 * Tabs Menu Item Block
 *
 * @package WordPress
 */

/**
 * Render callback for core/tabs-menu-item.
 *
 * Applies IAPI directives and tab-specific attributes to the saved content.
 *
 * @param array     $attributes Block attributes.
 * @param string    $content    Block content.
 * @param \WP_Block $block      WP_Block instance.
 *
 * @return string Updated HTML.
 */
function block_core_tabs_menu_item_render_callback( array $attributes, string $content, \WP_Block $block ): string {
	// Get tab-specific context
	$tab_index = $block->context['core/tabs-menu-item-index'] ?? 0;
	$tab_id    = $block->context['core/tabs-menu-item-id'] ?? '';
	$tab_label = $block->context['core/tabs-menu-item-label'] ?? '';

	if ( empty( $tab_id ) ) {
		$tab_id = 'tab-' . $tab_index;
	}

	// Process the content to add IAPI directives
	$tag_processor = new WP_HTML_Tag_Processor( $content );

	if ( $tag_processor->next_tag() ) {
		// Remove hidden attribute and template class (from save.js)
		$tag_processor->remove_attribute( 'hidden' );

		// Set tab-specific attributes
		$tag_processor->set_attribute( 'id', 'tab__' . $tab_id );
		$tag_processor->set_attribute( 'href', '#' . $tab_id );
		$tag_processor->set_attribute( 'role', 'tab' );
		$tag_processor->set_attribute( 'aria-controls', $tab_id );

		// Add IAPI directives
		$tag_processor->set_attribute( 'data-wp-on--click', 'actions.handleTabClick' );
		$tag_processor->set_attribute( 'data-wp-on--keydown', 'actions.handleTabKeyDown' );
		$tag_processor->set_attribute( 'data-wp-bind--aria-selected', 'state.isActiveTab' );
		$tag_processor->set_attribute( 'data-wp-bind--tabindex', 'state.tabIndexAttribute' );

		// Add context for this specific tab item
		$tag_processor->set_attribute(
			'data-wp-context',
			wp_json_encode( array( 'tabIndex' => $tab_index ) )
		);
	}

	// Get updated HTML and inject the label
	$output = $tag_processor->get_updated_html();

	// The save.js outputs <a><span class="screen-reader-text">...</span></a>
	// Replace the anchor content with the actual tab label
	$output = preg_replace(
		'/(<a[^>]*>).*?(<\/a>)/s',
		'$1' . '<span>' . esc_html( html_entity_decode( $tab_label ) ) . '</span>' . '$2',
		$output
	);

	return $output;
}

/**
 * Registers the `core/tabs-menu-item` block on the server.
 *
 * @since 6.9.0
 */
function register_block_core_tabs_menu_item() {
	register_block_type_from_metadata(
		__DIR__ . '/tabs-menu-item',
		array(
			'render_callback' => 'block_core_tabs_menu_item_render_callback',
		)
	);
}
add_action( 'init', 'register_block_core_tabs_menu_item' );
