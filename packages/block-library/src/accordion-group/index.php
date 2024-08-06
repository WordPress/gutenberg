<?php
/**
 * Server-side rendering of the `core/accordion-group` block.
 *
 * @package WordPress
 * @since 6.6.0
 *
 * @param array $attributes The block attributes.
 * @param string $content The block content.
 *
 * @return string Returns the updated markup.
 */
function render_block_core_accordion_group( $attributes, $content ) {
	if ( ! $content ) {
		return $content;
	}

	$suffix = wp_scripts_get_suffix();
	if ( defined( 'IS_GUTENBERG_PLUGIN' ) && IS_GUTENBERG_PLUGIN ) {
		$module_url = gutenberg_url( '/build/interactivity/accordionGroup.min.js' );
	}

	wp_register_script_module(
		'@wordpress/block-library/accordion-group',
		isset( $module_url ) ? $module_url : includes_url( "blocks/accordion-group/view{$suffix}.js" ),
		array( '@wordpress/interactivity' ),
		defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : get_bloginfo( 'version' )
	);

	wp_enqueue_script_module( '@wordpress/block-library/accordion-group' );

	$p         = new WP_HTML_Tag_Processor( $content );
	$autoclose = $attributes['autoclose'] ? 'true' : 'false';

	if ( $p->next_tag( array( 'class_name' => 'wp-block-accordion-group' ) ) ) {
		$p->set_attribute( 'data-wp-interactive', 'core/accordion' );
		$is_open = wp_json_encode( block_core_accordion_group_item_ids() );
		$p->set_attribute( 'data-wp-context', '{ "autoclose": ' . $autoclose . ', "isOpen":' . $is_open . ' }' );

		// Only modify content if directives have been set.
		$content = $p->get_updated_html();
	}

	return $content;
}

/**
 * Returns the existing list of ids, or adds a new id to the list.
 *
 * @since 6.6.0
 *
 * @param string $id The id of the accordion item.
 * @return array|void Returns the ids for the  or nothing.
 */
function block_core_accordion_group_item_ids( $id = null ) {
	static $ids = array();
	if ( null === $id ) {
		// Returns the ids and resets them for the next accordion group.
		$current_ids = $ids;
		$ids         = array();
		return $current_ids;
	}
	// Adds the id to the current accordion group list.
	$ids[] = $id;
}

/**
 * Registers the `core/accordion-group` block on server.
 *
 * @since 6.6.0
 */
function register_block_core_accordion_group() {
	register_block_type_from_metadata(
		__DIR__ . '/accordion-group',
		array(
			'render_callback' => 'render_block_core_accordion_group',
		)
	);
}
add_action( 'init', 'register_block_core_accordion_group' );
