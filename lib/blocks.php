<?php
/**
 * Functions related to editor blocks for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

$wp_registered_blocks = array();

/**
 * Registers a block.
 *
 * @param  string $name Block name including namespace.
 * @param  array  $settings Block settings.

 * @return array            The block, if it has been successfully registered.
 */
function register_block_type( $name, $settings ) {
	global $wp_registered_blocks;

	if ( ! is_string( $name ) ) {
		$message = __( 'Block names must be strings.', 'gutenberg' );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}

	$name_matcher = '/^[a-z0-9-]+\/[a-z0-9-]+$/';
	if ( ! preg_match( $name_matcher, $name ) ) {
		$message = __( 'Block names must contain a namespace prefix. Example: my-plugin/my-custom-block', 'gutenberg' );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}

	if ( isset( $wp_registered_blocks[ $name ] ) ) {
		/* translators: 1: block name */
		$message = sprintf( __( 'Block "%s" is already registered.', 'gutenberg' ), $name );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}

	$settings['name'] = $name;
	$wp_registered_blocks[ $name ] = $settings;

	return $settings;
}

/**
 * Unregisters a block.
 *
 * @param  string $name Block name.
 * @return array        The previous block value, if it has been
 *                      successfully unregistered; otherwise `null`.
 */
function unregister_block_type( $name ) {
	global $wp_registered_blocks;
	if ( ! isset( $wp_registered_blocks[ $name ] ) ) {
		/* translators: 1: block name */
		$message = sprintf( __( 'Block "%s" is not registered.', 'gutenberg' ), $name );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}
	$unregistered_block = $wp_registered_blocks[ $name ];
	unset( $wp_registered_blocks[ $name ] );

	return $unregistered_block;
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

	$parser = new Gutenberg_PEG_Parser;
	$blocks = $parser->parse( $content );

	$content_after_blocks = '';

	foreach ( $blocks as $block ) {
		$block_name = isset( $block['blockName'] ) ? $block['blockName'] : null;
		$attributes = is_array( $block['attrs'] ) ? $block['attrs'] : array();
		if ( $block_name && isset( $wp_registered_blocks[ $block_name ] ) ) {

			$content = null;
			if ( isset( $block['rawContent'] ) ) {
				$content = $block['rawContent'];
			}

			$content_after_blocks .= call_user_func(
				$wp_registered_blocks[ $block_name ]['render'],
				$attributes,
				$content
			);
		} else {
			$content_after_blocks .= $block['rawContent'];
		}
	}

	return $content_after_blocks;
}
add_filter( 'the_content', 'do_blocks', 9 ); // BEFORE do_shortcode() and wpautop().
