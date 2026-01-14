<?php
/**
 * Tabs Block
 *
 * @package WordPress
 */

/**
 * Render callback for core/tab.
 *
 * @param array     $attributes Block attributes.
 * @param string    $content    Block content.
 *
 * @return string Updated HTML.
 */
function block_core_tab_render( array $attributes, string $content ): string {
	$tag_processor = new WP_HTML_Tag_Processor( $content );
	$tag_processor->next_tag( array( 'class_name' => 'wp-block-tab' ) );
	$tab_id = (string) $tag_processor->get_attribute( 'id' );
	// If no id, generate a unique one
	if ( empty( $tab_id ) ) {
		$tab_id = sanitize_title( $attributes['label'] );
		$tag_processor->set_attribute( 'id', $tab_id );
	}

	/**
	 * Add interactivity to the tab element.
	 */
	$tag_processor->set_attribute(
		'data-wp-interactive',
		'core/tabs/private'
	);
	$tag_processor->set_attribute(
		'data-wp-context',
		wp_json_encode(
			array(
				'tab' => array(
					'id' => $tab_id,
				),
			)
		)
	);

	/**
	 * Process accessibility and interactivity attributes.
	 */
	$tag_processor->set_attribute( 'role', 'tabpanel' );
	$tag_processor->set_attribute( 'aria-labelledby', 'tab__' . $tab_id );
	$tag_processor->set_attribute( 'data-wp-bind--hidden', '!state.isActiveTab' );
	$tag_processor->set_attribute( 'data-wp-bind--tabindex', 'state.tabIndexAttribute' );

	return (string) $tag_processor->get_updated_html();
}

/**
 * Registers the `core/tab` block on the server.
 *
 * @hook init
 *
 * @since 6.9.0
 */
function register_block_core_tab() {
	register_block_type_from_metadata(
		__DIR__ . '/tab',
		array(
			'render_callback' => 'block_core_tab_render',
		)
	);
}
add_action( 'init', 'register_block_core_tab' );
