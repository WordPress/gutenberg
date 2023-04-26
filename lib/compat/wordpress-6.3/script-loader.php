<?php
/**
 * Updates the script-loader.php file
 *
 * @package gutenberg
 */

/**
 * Removes the actions that output all duotone SVG filter presets.
 * WP_Duotone_Gutenberg now handles which SVG filters should be output
 * depending on the block content.
 */
remove_action( 'wp_body_open', 'wp_global_styles_render_svg_filters' );
remove_action( 'in_admin_header', 'wp_global_styles_render_svg_filters' );


/**
 * Function responsible for enqueuing the assets required for block styles functionality on the editor.
 *
 * @since 5.3.0
 * @since 6.3.0 Support styles for block variations.
 */
function gutenberg_enqueue_editor_block_styles_assets() {
	$block_styles = WP_Block_Styles_Registry::get_instance()->get_all_registered();

	$register_script_lines = array( '( function() {' );
	foreach ( $block_styles as $block_name => $styles ) {
		foreach ( $styles as $style_properties ) {
			$block_style = array(
				'name'  => $style_properties['name'],
				'label' => $style_properties['label'],
			);
			if ( isset( $style_properties['is_default'] ) ) {
				$block_style['isDefault'] = $style_properties['is_default'];
			}
			if ( isset( $style_properties['variations'] ) ) {
				$block_style['variations'] = $style_properties['variations'];
			}
			$register_script_lines[] = sprintf(
				'	wp.blocks.registerBlockStyle( \'%s\', %s );',
				$block_name,
				wp_json_encode( $block_style )
			);
		}
	}
	$register_script_lines[] = '} )();';
	$inline_script           = implode( "\n", $register_script_lines );

	wp_register_script( 'wp-block-styles', false, array( 'wp-blocks' ), true, true );
	wp_add_inline_script( 'wp-block-styles', $inline_script );
	wp_enqueue_script( 'wp-block-styles' );
}

// Remove the Core action hook to avoid handling editor block style assets twice.
remove_action( 'enqueue_block_editor_assets', 'enqueue_editor_block_styles_assets' );
add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_editor_block_styles_assets' );
