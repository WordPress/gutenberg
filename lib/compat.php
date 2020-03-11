<?php
/**
 * Temporary compatibility shims for features present in Gutenberg, pending
 * upstream commit to the WordPress core source repository. Functions here
 * exist only as long as necessary for corresponding WordPress support, and
 * each should be associated with a Trac ticket.
 *
 * @package gutenberg
 */

 if ( ! function_exists( 'register_block_type_from_metadata' ) ) {
	/**
	 * Registers a block type from metadata stored in the `block.json` file.
	 *
	 * @since 7.8.0
	 *
	 * @param string $path Path to the folder where the `block.json` file is located.
	 *                     Alternatively it's possible to provide only the name of the
	 *                     last folder for blocks located in the WordPress core.
	 * @param array  $args {
	 *     Optional. Array of block type arguments. Any arguments may be defined, however the
	 *     ones described below are supported by default. Default empty array.
	 *
	 *     @type callable $render_callback Callback used to render blocks of this block type.
	 * }
	 * @return WP_Block_Type|false The registered block type on success, or false on failure.
	 */
	function register_block_type_from_metadata( $path, $args = array() ) {
		$path = is_dir( $path ) ? $path : ABSPATH . WPINC . '/blocks/' . $path;
		$file = trailingslashit( $path ) . 'block.json';
		if ( ! file_exists( $file ) ) {
			return false;
		}

		$metadata = json_decode( file_get_contents( $path ), true );
		if ( ! is_array( $metadata ) ) {
			return false;
		}

		return register_block_type(
			$metadata['name'],
			array_merge(
				$metadata,
				$args
			)
		);
	}
 }

/**
 * Adds a polyfill for the WHATWG URL in environments which do not support it.
 * The intention in how this action is handled is under the assumption that this
 * code would eventually be placed at `wp_default_packages_vendor`, which is
 * called as a result of `wp_default_packages` via the `wp_default_scripts`.
 *
 * This can be removed when plugin support requires WordPress 5.4.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/49360
 * @see https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
 * @see https://developer.wordpress.org/reference/functions/wp_default_packages_vendor/
 *
 * @since 7.3.0
 *
 * @param WP_Scripts $scripts WP_Scripts object.
 */
function gutenberg_add_url_polyfill( $scripts ) {
	// Only register polyfill if not already registered. This prevents handling
	// in an environment where core has updated to manage the polyfill. This
	// depends on the action being handled after default script registration.
	$is_polyfill_script_registered = (bool) $scripts->query( 'wp-polyfill-url', 'registered' );
	if ( $is_polyfill_script_registered ) {
		return;
	}

	gutenberg_register_vendor_script(
		$scripts,
		'wp-polyfill-url',
		'https://unpkg.com/polyfill-library@3.42.0/polyfills/URL/polyfill.js',
		array(),
		'3.42.0'
	);

	did_action( 'init' ) && $scripts->add_inline_script(
		'wp-polyfill',
		wp_get_script_polyfill(
			$scripts,
			array(
				'\'URL\' in window' => 'wp-polyfill-url',
			)
		)
	);
}
add_action( 'wp_default_scripts', 'gutenberg_add_url_polyfill', 20 );

/**
 * Adds a polyfill for DOMRect in environments which do not support it.
 *
 * This can be removed when plugin support requires WordPress 5.4.0+.
 *
 * @see gutenberg_add_url_polyfill
 * @see https://core.trac.wordpress.org/ticket/49360
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMRect
 * @see https://developer.wordpress.org/reference/functions/wp_default_packages_vendor/
 *
 * @since 7.5.0
 *
 * @param WP_Scripts $scripts WP_Scripts object.
 */
function gutenberg_add_dom_rect_polyfill( $scripts ) {
	// Only register polyfill if not already registered. This prevents handling
	// in an environment where core has updated to manage the polyfill. This
	// depends on the action being handled after default script registration.
	$is_polyfill_script_registered = (bool) $scripts->query( 'wp-polyfill-dom-rect', 'registered' );
	if ( $is_polyfill_script_registered ) {
		return;
	}

	gutenberg_register_vendor_script(
		$scripts,
		'wp-polyfill-dom-rect',
		'https://unpkg.com/polyfill-library@3.42.0/polyfills/DOMRect/polyfill.js',
		array(),
		'3.42.0'
	);

	did_action( 'init' ) && $scripts->add_inline_script(
		'wp-polyfill',
		wp_get_script_polyfill(
			$scripts,
			array(
				'window.DOMRect' => 'wp-polyfill-dom-rect',
			)
		)
	);
}
add_action( 'wp_default_scripts', 'gutenberg_add_dom_rect_polyfill', 20 );

/**
 * Sets the current post for usage in template blocks.
 *
 * @return WP_Post|null The post if any, or null otherwise.
 */
function gutenberg_get_post_from_context() {
	// TODO: Without this temporary fix, an infinite loop can occur where
	// posts with post content blocks render themselves recursively.
	if ( is_admin() || defined( 'REST_REQUEST' ) ) {
		return null;
	}
	if ( ! in_the_loop() ) {
		rewind_posts();
		the_post();
	}
	return get_post();
}
