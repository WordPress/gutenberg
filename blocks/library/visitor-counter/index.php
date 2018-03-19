<?php
/**
 * Server-side rendering of the `core/visitor-counter` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/visitor-counter` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with latest posts added.
 */
function render_block_core_visitor_counter( $attributes ) {
	global $wpdb;

	$count = get_post_meta( get_the_ID(), 'visitor-count', true );
	if ( ! is_admin() ) {
		$count++;

		$wpdb->query( $wpdb->prepare( "UPDATE $wpdb->postmeta SET meta_value=meta_value+1 WHERE meta_key='visitor-count' AND post_ID=%d", get_the_ID() ) );
	}

	$count = str_pad( $count, 8, '0', STR_PAD_LEFT );

	$content = <<<HTML
		<div class="wp-block-visitor-counter">
			<div class="visitor-counter-border visitor-counter-top-border"></div>
			<div class="visitor-counter-border visitor-counter-right-border"></div>
			<div class="visitor-counter-border visitor-counter-bottom-border"></div>
			<div class="visitor-counter-border visitor-counter-left-border"></div>
			<div class="visitor-counter-digits">$count</div>
		</div>
HTML;

	return $content;
}

/**
 * Registers the `core/visitor-counter` block on server.
 */
function register_block_core_visitor_counter() {
	register_meta( 'post', 'visitor-count', array(
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'integer',
	) );

	register_block_type( 'core/visitor-counter', array(
		'attributes'      => array(
			'count' => array(
				'type'    => 'number',
				'default' => 0,
			),
		),
		'render_callback' => 'render_block_core_visitor_counter',
	) );
}
add_action( 'init', 'register_block_core_visitor_counter' );
