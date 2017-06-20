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
	$matcher = '/<!--\s*wp:([a-z](?:[a-z0-9\/]+)*)\s+((?:(?!-->).)*)\s*\/?-->(?:.*?<!--\s*\/wp:\g1\s+-->)?/s';
	preg_match_all( $matcher, $content, $matches, PREG_OFFSET_CAPTURE );

	$new_content = $content;
	foreach ( $matches[0] as $index => $block_match ) {
		$block_name = $matches[1][ $index ][0];
		// do nothing if the block is not registered.
		if ( ! isset( $wp_registered_blocks[ $block_name ] ) ) {
			continue;
		}

		$block_markup = $block_match[0];
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
function register_block_assets( $name, $assets ) {
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
 * Lifted into a function so validation can be more easily added.
 *
 * @param array $current_assets Array of current assets.
 * @param array $new_assets     Array of new assets.
 * @return array Array of merged assets.
 */
function gutenberg_merge_assets( $current_assets, $new_assets ) {
	return array_merge_recursive( $current_assets, $new_assets );
}

/**
 * Adds assets to be displayed in the theme.
 *
 * @param string $name   Name of the block to register to.
 * @param array  $assets Array of new assets.
 *
 * @return array Array of asset data for block.
 */
function gutenberg_register_block_theme_assets( $name, $assets ) {
	$theme_assets = array(
		'theme' => $assets,
	);
	return register_block_assets( $name, $theme_assets );
}

/**
 * Add assets to be displayed in the editor.
 *
 * @param string $name   Name of the block to register to.
 * @param array  $assets Array of new assets.
 *
 * @return array Array of asset data for block.
 */
function gutenberg_register_block_editor_assets( $name, $assets ) {
	$editor_assets = array(
		'editor' => $assets,
	);
	return register_block_assets( $name, $editor_assets );
}

/**
 * Add styles to be displayed in the editor.
 *
 * @param string $name   Name of the block to register to.
 * @param array  $styles Array of new styles data.
 *
 * @return array Array of asset data for block.
 */
function gutenberg_register_block_editor_styles( $name, $styles ) {
	$editor_styles = array(
		'styles' => $styles,
	);
	return gutenberg_register_block_editor_assets( $name, $editor_styles );
}

/**
 * Add styles to be displayed in the theme.
 *
 * @param string $name   Name of the block to register to.
 * @param array  $styles Array of new styles data.
 *
 * @return array Array of asset data for block.
 */
function gutenberg_register_block_theme_styles( $name, $styles ) {
	$editor_styles = array(
		'styles' => $styles,
	);
	return gutenberg_register_block_theme_assets( $name, $editor_styles );
}

/**
 * Add scripts to be displayed in the editor.
 *
 * @param string $name   Name of the block to register to.
 * @param array  $scripts Array of new scripts data.
 *
 * @return array Array of asset data for block.
 */
function gutenberg_register_block_editor_scripts( $name, $scripts ) {
	$editor_scripts = array(
		'scripts' => $scripts,
	);
	return gutenberg_register_block_editor_assets( $name, $editor_scripts );
}

/**
 * Add scripts to be displayed in the theme.
 *
 * @param string $name   Name of the block to register to.
 * @param array  $scripts Array of new scripts data.
 *
 * @return array Array of asset data for block.
 */
function gutenberg_register_block_theme_scripts( $name, $scripts ) {
	$theme_scripts = array(
		'scripts' => $scripts,
	);
	return gutenberg_register_block_theme_assets( $name, $theme_scripts );
}

/**
 * Adds a block style to the editor.
 *
 * Should use the same function signature as wp_register_script() after $name.
 *
 * @param string           $name      Block name to register to.
 * @param string           $handle    (Required) Name of the script. Should be unique.
 * @param string           $src       (Required) Full URL of the script,
 *     or path of the script relative to the WordPress root directory.
 * @param array            $deps      (Optional) An array of registered script
 *     handles this script depends on. Default value: array().
 * @param string|bool|null $version   (Optional) String specifying script
 *    version number, if it has one, which is added to the URL as a query string
 *    for cache busting purposes. If version is set to false, a version number is
 *    automatically added equal to current installed WordPress version.
 *    If set to null, no version is added. Default value: false.
 * @param string           $media (Optional) Targeted medium. Default value: 'all'.
 *
 * @return array Array of asset data for block.
 */
function gutenberg_add_block_editor_style( $name, $handle, $src, $deps = array(), $version = false, $media = 'all' ) {
	$style = array(
		'handle' => $handle,
		'src'    => $src,
		'deps'   => $deps,
		'ver'    => $version,
		'media'  => $media,
	);

	return gutenberg_register_block_editor_styles( $name, array( $style ) );
}

/**
 * Adds a block style to the theme.
 *
 * Should use the same function signature as wp_register_script() after $name.
 *
 * @param string           $name      Block name to register to.
 * @param string           $handle    (Required) Name of the script. Should be unique.
 * @param string           $src       (Required) Full URL of the script,
 *     or path of the script relative to the WordPress root directory.
 * @param array            $deps      (Optional) An array of registered script
 *     handles this script depends on. Default value: array().
 * @param string|bool|null $version   (Optional) String specifying script
 *    version number, if it has one, which is added to the URL as a query string
 *    for cache busting purposes. If version is set to false, a version number is
 *    automatically added equal to current installed WordPress version.
 *    If set to null, no version is added. Default value: false.
 * @param string           $media (Optional) Targeted medium. Default value: 'all'.
 *
 * @return array Array of asset data for block.
 */
function gutenberg_add_block_theme_style( $name, $handle, $src, $deps = array(), $version = false, $media = 'all' ) {
	$style = array(
		'handle' => $handle,
		'src'    => $src,
		'deps'   => $deps,
		'ver'    => $version,
		'media'  => $media,
	);

	return gutenberg_register_block_theme_styles( $name, array( $style ) );
}

/**
 * Adds a block script to the editor.
 *
 * Should use the same function signature as wp_register_script() after $name.
 *
 * @param string           $name      Block name to register to.
 * @param string           $handle    (Required) Name of the script. Should be unique.
 * @param string           $src       (Required) Full URL of the script,
 *     or path of the script relative to the WordPress root directory.
 * @param array            $deps      (Optional) An array of registered script
 *     handles this script depends on. Default value: array().
 * @param string|bool|null $version   (Optional) String specifying script
 *    version number, if it has one, which is added to the URL as a query string
 *    for cache busting purposes. If version is set to false, a version number is
 *    automatically added equal to current installed WordPress version.
 *    If set to null, no version is added. Default value: false.
 * @param bool             $in_footer (Optional) Whether to enqueue the script
 *     before </body> instead of in the <head>. Default 'false'. Default value: false.
 *
 * @return array Array of asset data for block.
 */
function gutenberg_add_block_editor_script( $name, $handle, $src, $deps = array(), $version = false, $in_footer = false ) {
	$script = array(
		'handle'    => $handle,
		'src'       => $src,
		'deps'      => $deps,
		'ver'       => $version,
		'in_footer' => $in_footer,
	);

	return gutenberg_register_block_editor_scripts( $name, array( $script ) );
}

/**
 * Adds a block script to the theme.
 *
 * Should use the same function signature as wp_register_script() after $name.
 *
 * @param string           $name      Block name to register to.
 * @param string           $handle    (Required) Name of the script. Should be unique.
 * @param string           $src       (Required) Full URL of the script,
 *     or path of the script relative to the WordPress root directory.
 * @param array            $deps      (Optional) An array of registered script
 *     handles this script depends on. Default value: array().
 * @param string|bool|null $version   (Optional) String specifying script
 *    version number, if it has one, which is added to the URL as a query string
 *    for cache busting purposes. If version is set to false, a version number is
 *    automatically added equal to current installed WordPress version.
 *    If set to null, no version is added. Default value: false.
 * @param bool             $in_footer (Optional) Whether to enqueue the script
 *     before </body> instead of in the <head>. Default 'false'. Default value: false.
 *
 * @return array Array of asset data for block.
 */
function gutenberg_add_block_theme_script( $name, $handle, $src, $deps = array(), $version = false, $in_footer = false ) {
	$script = array(
		'handle'    => $handle,
		'src'       => $src,
		'deps'      => $deps,
		'ver'       => $version,
		'in_footer' => $in_footer,
	);

	return gutenberg_register_block_theme_scripts( $name, array( $script ) );
}
