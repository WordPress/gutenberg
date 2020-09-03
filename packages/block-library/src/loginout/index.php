<?php
/**
 * Server-side rendering of the `core/post-author` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-author` block on the server.
 *
 * @param  array    $attributes Block attributes.
 * @param  string   $content    Block default content.
 * @param  WP_Block $block      Block instance.
 * @return string Returns the rendered author block.
 */
function render_block_core_loginout( $attributes, $content, $block ) {
	if ( ! is_user_logged_in() ) {
		$log_in_text = ( isset( $attributes['logInText'] ) && $attributes['logInText'] )
			? $attributes['logInText']
			: __( 'Log In' );

        /** This filter is documented in wp-includes/general-template.php */
		return apply_filters( 'loginout', '<a class="wp-block-loginout" href="' . esc_url( wp_login_url() ) . '">' . $log_in_text . '</a>' );
	}

	$log_out_text = ( isset( $attributes['logOutText'] ) && $attributes['logOutText'] )
		? $attributes['logOutText']
		: __( 'Log Out' );

	/** This filter is documented in wp-includes/general-template.php */
	return apply_filters( 'loginout', '<a class="wp-block-loginout" href="' . esc_url( wp_logout_url() ) . '">' . $log_out_text . '</a>' );
}

/**
 * Registers the `core/post-author` block on the server.
 */
function register_block_core_post_author() {
	register_block_type_from_metadata(
		__DIR__ . '/loginout',
		array(
			'render_callback' => 'render_block_core_loginout',
		)
	);
}
add_action( 'init', 'register_block_core_post_author' );
