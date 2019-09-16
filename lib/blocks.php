<?php
/**
 * Block and style registration functions.
 *
 * @package gutenberg
 */

/**
 * Substitutes the implementation of a core-registered block type, if exists,
 * with the built result from the plugin.
 */
function gutenberg_reregister_core_block_types() {
	// Blocks directory may not exist if working from a fresh clone.
	$blocks_dir = dirname( __FILE__ ) . '/../build/block-library/blocks/';
	if ( ! file_exists( $blocks_dir ) ) {
		return;
	}

	$block_names = array(
		'archives.php'        => 'core/archives',
		'block.php'           => 'core/block',
		'calendar.php'        => 'core/calendar',
		'categories.php'      => 'core/categories',
		'latest-comments.php' => 'core/latest-comments',
		'latest-posts.php'    => 'core/latest-posts',
		'legacy-widget.php'   => 'core/legacy-widget',
		'navigation-menu.php' => 'core/navigation-menu',
		'rss.php'             => 'core/rss',
		'shortcode.php'       => 'core/shortcode',
		'search.php'          => 'core/search',
		'social-link.php'     => 'core/social-link',
		'tag-cloud.php'       => 'core/tag-cloud',
	);

	$registry = WP_Block_Type_Registry::get_instance();

	foreach ( $block_names as $file => $block_name ) {
		if ( ! file_exists( $blocks_dir . $file ) ) {
			return;
		}

		if ( $registry->is_registered( $block_name ) ) {
			$registry->unregister( $block_name );
		}

		require $blocks_dir . $file;
	}
}
add_action( 'init', 'gutenberg_reregister_core_block_types' );

if ( ! function_exists( 'register_block_style' ) ) {
	/**
	 * Registers a new block style.
	 *
	 * @param string $block_name       Block type name including namespace.
	 * @param array  $style_properties Array containing the properties of the style name, label, style (name of the stylesheet to be enqueued), inline_style (string containing the CSS to be added).
	 *
	 * @return boolean True if the block style was registered with success and false otherwise.
	 */
	function register_block_style( $block_name, $style_properties ) {
		return WP_Block_Styles_Registry::get_instance()->register( $block_name, $style_properties );
	}
}

if ( ! function_exists( 'unregister_block_style' ) ) {
	/**
	 * Unregisters a block style.
	 *
	 * @param string $block_name       Block type name including namespace.
	 * @param array  $block_style_name Block style name.
	 *
	 * @return boolean True if the block style was unregistered with success and false otherwise.
	 */
	function unregister_block_style( $block_name, $block_style_name ) {
		return WP_Block_Styles_Registry::get_instance()->unregister( $block_name, $block_style_name );
	}
}

if ( ! has_action( 'enqueue_block_assets', 'enqueue_block_styles_assets' ) ) {
	/**
	 * Function responsible for enqueuing the styles required for block styles functionality on the editor and on the frontend.
	 */
	function gutenberg_enqueue_block_styles_assets() {
		$block_styles = WP_Block_Styles_Registry::get_instance()->get_all_registered();

		foreach ( $block_styles as $styles ) {
			foreach ( $styles as $style_properties ) {
				if ( isset( $style_properties['style_handle'] ) ) {
					wp_enqueue_style( $style_properties['style_handle'] );
				}
				if ( isset( $style_properties['inline_style'] ) ) {
					wp_add_inline_style( 'wp-block-library', $style_properties['inline_style'] );
				}
			}
		}
	}
	add_action( 'enqueue_block_assets', 'gutenberg_enqueue_block_styles_assets', 30 );
}
if ( ! has_action( 'enqueue_block_editor_assets', 'enqueue_editor_block_styles_assets' ) ) {
	/**
	 * Function responsible for enqueuing the assets required for block styles functionality on the editor.
	 */
	function gutenberg_enqueue_editor_block_styles_assets() {
		$block_styles = WP_Block_Styles_Registry::get_instance()->get_all_registered();

		$register_script_lines = array( '( function() {' );
		foreach ( $block_styles as $block_name => $styles ) {
			foreach ( $styles as $style_properties ) {
				$register_script_lines[] = sprintf(
					'	wp.blocks.registerBlockStyle( \'%s\', %s );',
					$block_name,
					wp_json_encode(
						array(
							'name'  => $style_properties['name'],
							'label' => $style_properties['label'],
						)
					)
				);
			}
		}
		$register_script_lines[] = '} )();';
		$inline_script           = implode( "\n", $register_script_lines );

		wp_register_script( 'wp-block-styles', false, array( 'wp-blocks' ), true, true );
		wp_add_inline_script( 'wp-block-styles', $inline_script );
		wp_enqueue_script( 'wp-block-styles' );
	}
	add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_editor_block_styles_assets' );
}
