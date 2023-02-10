<?php
/**
 * LRegister shortcodes used to render dynamic text.
 *
 * @package gutenberg
 */

/**
 * Add shortcodes used to render dynamic text.
 */
function add_dynamic_text_shortcodes() {
	$shortcodes = array(
		'dynamic-text-current-year' => function() {
			return gmdate( 'Y' );
		},
	);
	foreach ( $shortcodes as $shortcode => $callback ) {
		add_shortcode( $shortcode, $callback );
	}
}
add_action( 'init', 'add_dynamic_text_shortcodes' );
