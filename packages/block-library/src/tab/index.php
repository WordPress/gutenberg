<?php
/**
 * Tab Block
 *
 * @package WordPress
 */

/**
 * Render callback for core/tab.
 *
 * Injects the tab label and IAPI directives into the saved button HTML.
 * Per-item context (index, id, label) is provided by the parent tab-list
 * render callback before this is called.
 *
 * @since 7.0.0
 *
 * @param array     $attributes Block attributes.
 * @param string    $content    Block content (styled button from save.js).
 * @param \WP_Block $block      WP_Block instance.
 *
 * @return string Updated HTML.
 */
function block_core_tab_render_callback( array $attributes, string $content, \WP_Block $block ): string {
	$tab_index = $block->context['core/tab-index'] ?? 0;
	$tab_id    = $block->context['core/tab-id'] ?? '';
	$tab_label = $block->context['core/tab-label'] ?? '';

	if ( empty( $tab_id ) ) {
		$tab_id = 'tab-' . $tab_index;
	}

	// Add Interactivity API directives and tab-specific attributes to the button.
	$tag_processor = new WP_HTML_Tag_Processor( $content );

	if ( $tag_processor->next_tag() ) {
		$tag_processor->set_attribute( 'id', 'tab__' . $tab_id );
		$tag_processor->set_attribute( 'aria-controls', $tab_id );
		$tag_processor->set_attribute( 'data-wp-on--click', 'actions.handleTabClick' );
		$tag_processor->set_attribute( 'data-wp-on--keydown', 'actions.handleTabKeyDown' );
		$tag_processor->set_attribute( 'data-wp-bind--aria-selected', 'state.isActiveTab' );
		$tag_processor->set_attribute( 'data-wp-bind--tabindex', 'state.tabIndexAttribute' );
		$tag_processor->set_attribute(
			'data-wp-context',
			wp_json_encode( array( 'tabIndex' => $tab_index ) )
		);
	}

	// Inject the tab label into the button.
	return preg_replace(
		'/(<button\b[^>]*>).*?(<\/button>)/s',
		'$1<span>' . wp_kses_post( $tab_label ) . '</span>$2',
		$tag_processor->get_updated_html(),
		1
	);
}

/**
 * Registers the `core/tab` block on the server.
 *
 * @since 7.0.0
 */
function register_block_core_tab() {
	register_block_type_from_metadata(
		__DIR__ . '/tab',
		array(
			'render_callback' => 'block_core_tab_render_callback',
		)
	);
}
add_action( 'init', 'register_block_core_tab' );
