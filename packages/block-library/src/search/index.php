<?php
/**
 * Server-side rendering of the `core/search` block.
 *
 * @package WordPress
 */

/**
 * Dynamically renders the `core/search` block.
 *
 * @param array $attributes The block attributes.
 *
 * @return string The search block markup.
 */
function render_block_core_search( $attributes ) {
	static $instance_id = 0;

	$html = '
		<form role="search" method="get" class="wp-block-search" action="%1$s">
			<label for="%2$s" class="wp-block-search__label">%3$s</label>
			<input id="%2$s" type="search" class="wp-block-search__input" placeholder="%4$s" value="%5$s" name="s" />
		</form>
	';

	return sprintf(
		$html,
		esc_url( home_url( '/' ) ),
		'wp-block-search__input-' . ++$instance_id,
		esc_html( $attributes['label'] ),
		esc_attr( $attributes['placeholder'] ),
		esc_attr( get_search_query() )
	);
}

/**
 * Registers the `core/search` block on the server.
 */
function register_block_core_search() {
	register_block_type(
		'core/search',
		array(
			'attributes'      => array(
				'label'       => array(
					'type'    => 'string',
					'default' => __( 'Search' ),
				),
				'placeholder' => array(
					'type'    => 'string',
					'default' => __( 'Enter a search keyword or phrase' ),
				),
			),

			'render_callback' => 'render_block_core_search',
		)
	);
}

add_action( 'init', 'register_block_core_search' );
