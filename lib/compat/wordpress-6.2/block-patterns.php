<?php
/**
 * Overrides Core's wp-includes/block-patterns.php to add category descriptions for WP 6.2.
 *
 * @package gutenberg
 */

/**
 * Registers the block pattern categories REST API routes.
 */
function gutenberg_register_core_block_patterns_and_categories() {
	register_block_pattern_category(
		'banner',
		array(
			'label' => _x( 'Banners', 'Block pattern category', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'buttons',
		array(
			'label' => _x( 'Buttons', 'Block pattern category', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'columns',
		array(
			'label' => _x( 'Columns', 'Block pattern category', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'footer',
		array(
			'label' => _x( 'Footers', 'Block pattern category', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'gallery',
		array(
			'label' => _x( 'Gallery', 'Block pattern category', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'header',
		array(
			'label' => _x( 'Headers', 'Block pattern category', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'text',
		array(
			'label' => _x( 'Text', 'Block pattern category', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'query',
		array(
			'label'       => _x( 'Posts', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Display post summaries in lists, grids, and other layouts.', 'gutenberg' ),
		)
	);
	register_block_pattern_category(
		'featured',
		array(
			'label' => _x( 'Featured', 'Block pattern category', 'gutenberg' ),
		)
	);
}
add_action( 'init', 'gutenberg_register_core_block_patterns_and_categories' );

/**
 * Registers Gutenberg-bundled patterns, with a focus on headers and footers
 * for site editing.
 *
 * @since 6.2.0
 * @access private
 */
function gutenberg_register_core_block_patterns() {
	if ( ! get_theme_support( 'core-block-patterns' ) ) {
		return;
	}

	$core_block_patterns = array(
		'centered-footer',
		'centered-footer-with-social-links',
		'centered-header',
		'centered-logo-in-navigation',
		'footer-with-background-color-and-three-columns',
		'footer-with-credit-line-and-navigation',
		'footer-with-large-font-size',
		'footer-with-navigation-and-credit-line',
		'footer-with-search-site-title-and-credit-line',
		'footer-with-site-title-and-credit-line',
		'header-with-large-font-size',
		'left-aligned-footer',
		'right-aligned-footer',
		'simple-header',
		'simple-header-inside-image',
		'simple-header-with-background-color',
		'simple-header-with-image',
		'simple-header-with-tagline',
		'simple-header-with-tagline-2',
		'site-title-and-menu-button',
		'site-title-and-vertical-navigation',
	);

	foreach ( $core_block_patterns as $core_block_pattern ) {
		register_block_pattern(
			'core/' . $core_block_pattern,
			require __DIR__ . '/block-patterns/' . $core_block_pattern . '.php'
		);
	}
}
add_action( 'init', 'gutenberg_register_core_block_patterns' );
