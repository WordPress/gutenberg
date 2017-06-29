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
		$message = __( 'Block names must be strings.' );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}

	$name_matcher = '/^[a-z0-9-]+\/[a-z0-9-]+$/';
	if ( ! preg_match( $name_matcher, $name ) ) {
		$message = __( 'Block names must contain a namespace prefix. Example: my-plugin/my-custom-block' );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}

	if ( isset( $wp_registered_blocks[ $name ] ) ) {
		/* translators: 1: block name */
		$message = sprintf( __( 'Block "%s" is already registered.' ), $name );
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
		$message = sprintf( __( 'Block "%s" is not registered.' ), $name );
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

	// Extract the blocks from the post content.
	$matcher = '#' . join( '', array(
		'(?P<opener><!--\s*',
		'wp:(?P<block_name>[a-z](?:[a-z0-9/]+)*)\s+',
		'(?P<attributes>(?:(?!-->).)*?)',
		'\s*/?-->\n?)',
		'(?:',
		'(?P<content>.*?)',
		'(?P<closer><!--\s*/wp:\g{block_name}\s+-->\n?)',
		')?',
	) ) . '#s';
	preg_match_all( $matcher, $content, $matches, PREG_OFFSET_CAPTURE );

	$new_content = $content;
	$offset_differential = 0;
	foreach ( $matches[0] as $index => $block_match ) {
		$block_name = $matches['block_name'][ $index ][0];

		$output = '';
		if ( isset( $wp_registered_blocks[ $block_name ] ) ) {
			$block_attributes_string = trim( $matches['attributes'][ $index ][0] );
			$block_attributes = json_decode( $block_attributes_string, true );
			if ( ! is_array( $block_attributes ) ) {
				$block_attributes = array();
			}

			// Call the block's render function to generate the dynamic output.
			$output = call_user_func( $wp_registered_blocks[ $block_name ]['render'], $block_attributes );
		} elseif ( isset( $matches['content'][ $index ][0] ) ) {
			$output = $matches['content'][ $index ][0];
		}

		// Replace the matched block with the static or dynamic output.
		$new_content = substr_replace(
			$new_content,
			$output,
			$block_match[1] - $offset_differential,
			strlen( $block_match[0] )
		);

		// Update offset for the next replacement.
		$offset_differential += strlen( $block_match[0] ) - strlen( $output );
	}

	return $new_content;
}
add_filter( 'the_content', 'do_blocks', 9 ); // BEFORE do_shortcode() and wpautop().

/**
 * The low level API for registering assets to be loaded with a block.
 *
 * @param string $name   Name of already registered block you want to add assets to.
 * @param array  $assets Array of asset data. It follows the following format:
 *     array(
 *       // Location to load.
 *       'editor' => array(
 *         'scripts' => array(
 *           array(
 *             'handle' => 'name of script to enqueue',
 *             'src'    => 'url to resource',
 *             'deps'   => array() of dependencies,
 *             'ver'    => version of resource,
 *             'in_footer'  => any specific media restrictions,
 *           ),
 *         ),
 *         'styles' => array(
 *           array(
 *             'handle' => 'name of style to enqueue',
 *             'src'    => 'url to resource',
 *             'deps'   => array() of dependencies,
 *             'ver'    => version of resource,
 *             'media'  => any specific media restrictions,
 *           ),
 *         ),
 *       ),
 *       'theme'  => array(
 *         // Same as above.
 *       ),
 *     );
 *     Each individual asset is defined by an array matching the callback
 *     parameters to the matching wp_enqueue_{ script|style } function.
 * @return array Array of asset data for the block, after registering.
 */
function gutenberg_register_block_assets( $name, $assets ) {
	global $wp_registered_blocks;
	if ( ! isset( $wp_registered_blocks[ $name ] ) ) {
		/* translators: 1: block name */
		$message = sprintf( __( 'Block "%s" is not registered. It is possible you called this before it was registered.' ), $name );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}

	// Check to see if assets have not been registered.
	if ( ! isset( $wp_registered_blocks[ $name ]['assets'] ) ) {
		$wp_registered_blocks[ $name ]['assets'] = array();
	}

	$wp_registered_blocks[ $name ]['assets'] = gutenberg_merge_assets( $wp_registered_blocks[ $name ]['assets'], $assets );
	return $wp_registered_blocks[ $name ]['assets'];
}

/**
 * Currently a wrapper for array_merge_recursive().
 *
 * Lifted into a function so validation can be more easily added. Might not be
 * needed at all though.
 *
 * @param array $current_assets Array of current assets.
 * @param array $new_assets     Array of new assets.
 * @return array Array of merged assets.
 */
function gutenberg_merge_assets( $current_assets, $new_assets ) {
	return array_merge_recursive( $current_assets, $new_assets );
}

/**
 * Adds a block style to the editor.
 *
 * @param string $name Block name to register to.
 * @param array  $args Array of asset data related to wp_enqueue_style().
 *
 * @return array Array of asset data for block.
 */
function gutenberg_add_block_editor_style( $name, $args ) {
	if ( ! isset( $args['handle'] ) ) {
		/* translators: 1: block name */
		$message = 'Registered styles must provide a handle in $args array.';
		_doing_it_wrong( __FUNCTION__, $message, '0.2.0' );
		return array();
	}

	$defaults = array(
		'src'   => '',
		'deps'  => array(),
		'ver'   => false,
		'media' => 'all',
	);

	$args = wp_parse_args( $args, $defaults );

	$style = array(
		'handle' => $args['handle'],
		'src'    => $args['src'],
		'deps'   => $args['deps'],
		'ver'    => $args['ver'],
		'media'  => $args['media'],
	);

	$assets = array(
		'editor' => array(
			'styles' => array(
				$style,
			),
		),
	);

	return gutenberg_register_block_assets( $name, $assets );
}

/**
 * Adds a block style to the theme.
 *
 * @param string $name Block name to register to.
 * @param array  $args Array of asset data related to wp_enqueue_style().
 *
 * @return array Array of asset data for block.
 */
function gutenberg_add_block_theme_style( $name, $args ) {
	if ( ! isset( $args['handle'] ) ) {
		/* translators: 1: block name */
		$message = 'Registered styles must provide a handle in $args array.';
		_doing_it_wrong( __FUNCTION__, $message, '0.2.0' );
		return array();
	}

	$defaults = array(
		'src'   => '',
		'deps'  => array(),
		'ver'   => false,
		'media' => 'all',
	);

	$args = wp_parse_args( $args, $defaults );

	$style = array(
		'handle' => $args['handle'],
		'src'    => $args['src'],
		'deps'   => $args['deps'],
		'ver'    => $args['ver'],
		'media'  => $args['media'],
	);

	$assets = array(
		'theme' => array(
			'styles' => array(
				$style,
			),
		),
	);

	return gutenberg_register_block_assets( $name, $assets );
}

/**
 * Adds a block script to the editor.
 *
 * @param string $name Block name to register to.
 * @param array  $args Array of asset data related to wp_enqueue_script().
 *
 * @return array Array of asset data for block.
 */
function gutenberg_add_block_editor_script( $name, $args ) {
	if ( ! isset( $args['handle'] ) ) {
		/* translators: 1: block name */
		$message = 'Registered scripts must provide a handle in $args array.';
		_doing_it_wrong( __FUNCTION__, $message, '0.2.0' );
		return array();
	}

	$defaults = array(
		'src'   => '',
		'deps'  => array(),
		'ver'   => false,
		'in_footer' => false,
	);

	$args = wp_parse_args( $args, $defaults );

	$script = array(
		'handle' => $args['handle'],
		'src'    => $args['src'],
		'deps'   => $args['deps'],
		'ver'    => $args['ver'],
		'in_footer'  => $args['in_footer'],
	);

	$assets = array(
		'editor' => array(
			'scripts' => array(
				$script,
			),
		),
	);

	return gutenberg_register_block_assets( $name, $assets );
}

/**
 * Adds a block script to the theme.
 *
 * @param string $name Block name to register to.
 * @param array  $args Array of asset data related to wp_enqueue_script().
 *
 * @return array Array of asset data for block.
 */
function gutenberg_add_block_theme_script( $name, $args ) {
	if ( ! isset( $args['handle'] ) ) {
		/* translators: 1: block name */
		$message = 'Registered scripts must provide a handle in $args array.';
		_doing_it_wrong( __FUNCTION__, $message, '0.2.0' );
		return array();
	}

	$defaults = array(
		'src'   => '',
		'deps'  => array(),
		'ver'   => false,
		'in_footer' => false,
	);

	$args = wp_parse_args( $args, $defaults );

	$script = array(
		'handle' => $args['handle'],
		'src'    => $args['src'],
		'deps'   => $args['deps'],
		'ver'    => $args['ver'],
		'in_footer'  => $args['in_footer'],
	);

	$assets = array(
		'theme' => array(
			'scripts' => array(
				$script,
			),
		),
	);

	return gutenberg_register_block_assets( $name, $assets );
}
