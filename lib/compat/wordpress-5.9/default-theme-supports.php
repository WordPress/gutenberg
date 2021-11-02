<?php
/**
 * Loads default theme supports for block themes.
 *
 * @package gutenberg
 */

if ( gutenberg_is_fse_theme() ) {
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'editor-styles' );
	add_theme_support(
		'html5',
		array(
			'style',
			'script',
		)
	);
	add_theme_support( 'automatic-feed-links' );
	add_filter( 'should_load_separate_core_block_assets', '__return_true' );
}

/**
 * Overrides the WordPress enqueue_block_styles_assets function, which contains
 * a bug eventually leading to a fatal error for full site editing enabled themes
 * which do register custom block styles and don't have a template for requested
 * template (eg.: 404)
 *
 * More details on the bug can be found in: https://core.trac.wordpress.org/ticket/54323
 *
 * @see enqueue_block_styles_assets
 */
function gutenberg_enqueue_block_styles_assets() {
	$block_styles = WP_Block_Styles_Registry::get_instance()->get_all_registered();

	foreach ( $block_styles as $block_name => $styles ) {
		foreach ( $styles as $style_properties ) {
			if ( isset( $style_properties['style_handle'] ) ) {

				// If the site loads separate styles per-block, enqueue the stylesheet on render.
				if ( wp_should_load_separate_core_block_assets() ) {
					add_filter(
						'render_block',
						function( $html ) use ( $style_properties ) {
							wp_enqueue_style( $style_properties['style_handle'] );
							return $html;
						}
					);
				} else {
					wp_enqueue_style( $style_properties['style_handle'] );
				}
			}
			if ( isset( $style_properties['inline_style'] ) ) {

				// Default to "wp-block-library".
				$handle = 'wp-block-library';

				// If the site loads separate styles per-block, check if the block has a stylesheet registered.
				if ( wp_should_load_separate_core_block_assets() ) {
					$block_stylesheet_handle = generate_block_asset_handle( $block_name, 'style' );
					global $wp_styles;
					if ( isset( $wp_styles->registered[ $block_stylesheet_handle ] ) ) {
						$handle = $block_stylesheet_handle;
					}
				}

				// Add inline styles to the calculated handle.
				wp_add_inline_style( $handle, $style_properties['inline_style'] );
			}
		}
	}
}

if ( version_compare( get_bloginfo( 'version' ), '5.8.2', '<' ) && has_action( 'enqueue_block_assets', 'enqueue_block_styles_assets' ) ) {
	remove_action( 'enqueue_block_assets', 'enqueue_block_styles_assets', 30 );
	add_action( 'enqueue_block_assets', 'gutenberg_enqueue_block_styles_assets', 30 );
}
