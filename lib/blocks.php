<?php
/**
 * Functions related to editor blocks for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

define( 'GUTENBERG__BLOCKS_LIBRARY_DIR', GUTENBERG__PLUGIN_DIR . 'blocks/library' );

$wp_registered_blocks = array();

/**
 * Registers a block.
 *
 * @param  string $slug Block slug including namespace.
 * @param  array  $settings Block settings.

 * @return array            The block, if it has been successfully registered.
 */
function register_block_type( $slug, $settings ) {
	global $wp_registered_blocks;

	if ( ! is_string( $slug ) ) {
		$message = __( 'Block slugs must be strings.' );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}

	$slug_matcher = '/^[a-z0-9-]+\/[a-z0-9-]+$/';
	if ( ! preg_match( $slug_matcher, $slug ) ) {
		$message = __( 'Block slugs must contain a namespace prefix. Example: my-plugin/my-custom-block' );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}

	if ( isset( $wp_registered_blocks[ $slug ] ) ) {
		/* translators: 1: block slug */
		$message = sprintf( __( 'Block "%s" is already registered.' ), $slug );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}

	$settings['slug'] = $slug;
	$wp_registered_blocks[ $slug ] = $settings;

	return $settings;
}

/**
 * Unregisters a block.
 *
 * @param  string $slug Block slug.
 * @return array        The previous block value, if it has been
 *                        successfully unregistered; otherwise `null`.
 */
function unregister_block_type( $slug ) {
	global $wp_registered_blocks;
	if ( ! isset( $wp_registered_blocks[ $slug ] ) ) {
		/* translators: 1: block slug */
		$message = sprintf( __( 'Block "%s" is not registered.' ), $slug );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}
	$unregistered_block = $wp_registered_blocks[ $slug ];
	unset( $wp_registered_blocks[ $slug ] );

	return $unregistered_block;
}

/**
 * Extract the block attributes from the block's attributes string
 *
 * @since 0.1.0
 *
 * @param string $attr_string Attributes string.

 * @return array
 */
function parse_block_attributes( $attr_string ) {
	$attributes_matcher = '/([^\s]+)="([^"]+)"\s*/';
	preg_match_all( $attributes_matcher, $attr_string, $matches );
	$attributes = array();
	foreach ( $matches[1] as $index => $attribute_match ) {
		$attributes[ $attribute_match ] = $matches[2][ $index ];
	}

	return $attributes;
}

/**
 * Renders the dynamic blocks into the post content
 *
 * @since 0.1.0
 *
 * @param  string $content Post content.
 *
 * @return string          Updated post content.
 */
function do_blocks( $content ) {
	global $wp_registered_blocks;

	// Extract the blocks from the post content.
	$open_matcher = '/<!--\s*wp:([a-z](?:[a-z0-9\/]+)*)\s+((?:(?!-->).)*)-->.*?<!--\s*\/wp:\g1\s+-->/';
	preg_match_all( $open_matcher, $content, $matches, PREG_OFFSET_CAPTURE );

	$new_content = $content;
	foreach ( $matches[0] as $index => $block_match ) {
		$block_name = $matches[1][ $index ][0];
		// do nothing if the block is not registered.
		if ( ! isset( $wp_registered_blocks[ $block_name ] ) ) {
			continue;
		}

		$block_markup = $block_match[0];
		$block_position = $block_match[1];
		$block_attributes_string = $matches[2][ $index ][0];
		$block_attributes = parse_block_attributes( $block_attributes_string );

		// Call the block's render function to generate the dynamic output.
		$output = call_user_func( $wp_registered_blocks[ $block_name ]['render'], $block_attributes );

		// Replace the matched block with the dynamic output.
		$new_content = str_replace( $block_markup, $output, $new_content );
	}

	return $new_content;
}
add_filter( 'the_content', 'do_blocks', 10 ); // BEFORE do_shortcode().

/**
 * Loads the server-side rendering of blocks. If your block supports
 * server-side rendering, add it here.
 */
function gutenberg_load_blocks_server_side_rendering() {
	require_once GUTENBERG__BLOCKS_LIBRARY_DIR . '/latest-posts/index.php';
}
add_action( 'init', 'gutenberg_load_blocks_server_side_rendering' );
