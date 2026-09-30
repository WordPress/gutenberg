<?php
/**
 * Server-side rendering of the `core/loginout` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/loginout` block on server.
 *
 * @since 5.8.0
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the login-out link or form.
 */
function render_block_core_loginout( $attributes ) {

	/*
	 * Build the redirect URL. This current url fetching logic matches with the core.
	 *
	 * @see https://github.com/WordPress/wordpress-develop/blob/6bf62e58d21739938f3bb3f9e16ba702baf9c2cc/src/wp-includes/general-template.php#L528.
	 */
	$current_url = ( is_ssl() ? 'https://' : 'http://' ) . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];

	$user_logged_in = is_user_logged_in();

	$classes = $user_logged_in ? 'logged-in' : 'logged-out';

	$redirect = isset( $attributes['redirectToCurrent'] ) && $attributes['redirectToCurrent'] ? $current_url : '';

	$login_text  = ! empty( $attributes['loginText'] ) ? esc_html( $attributes['loginText'] ) : __( 'Log in' );
	$logout_text = ! empty( $attributes['logoutText'] ) ? esc_html( $attributes['logoutText'] ) : __( 'Log out' );

	if ( ! $user_logged_in ) {
		$link = '<a href="' . esc_url( wp_login_url( $redirect ) ) . '">' . $login_text . '</a>';
	} else {
		$link = '<a href="' . esc_url( wp_logout_url( $redirect ) ) . '">' . $logout_text . '</a>';
	}

	/**
	 * Filters the HTML output of the Log In/Log Out link.
	 *
	 * @since 7.2.0
	 *
	 * @param string $link The HTML link content.
	 */
	$contents = apply_filters( 'loginout', $link );

	// If logged-out and displayLoginAsForm is true, show the login form.
	if ( ! $user_logged_in && ! empty( $attributes['displayLoginAsForm'] ) ) {
		// Add a class.
		$classes .= ' has-login-form';

		// Get the form.
		$contents = wp_login_form(
			array(
				'echo'         => false,
				'label_log_in' => $login_text,
			)
		);

		if ( wp_is_block_theme() ) {
			$processor = new WP_HTML_Tag_Processor( $contents );

			while ( $processor->next_tag( 'input' ) ) {
				if ( 'submit' === $processor->get_attribute( 'type' ) && 'wp-submit' === $processor->get_attribute( 'name' ) ) {
					$processor->add_class( 'wp-block-button__link' );
					$processor->add_class( wp_theme_get_element_class_name( 'button' ) );
					$contents = $processor->get_updated_html();
					break;
				}
			}
		}
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $classes ) );

	return '<div ' . $wrapper_attributes . '>' . $contents . '</div>';
}

/**
 * Registers the `core/loginout` block on server.
 *
 * @since 5.8.0
 */
function register_block_core_loginout() {
	register_block_type_from_metadata(
		__DIR__ . '/loginout',
		array(
			'render_callback' => 'render_block_core_loginout',
		)
	);
}
add_action( 'init', 'register_block_core_loginout' );
