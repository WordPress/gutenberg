<?php
/**
 * Add support for block patterns and register default patterns.
 *
 * @package gutenberg
 */

add_theme_support( 'core-block-patterns' );

/**
 * Extends block editor settings to include a list of default patterns.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_extend_settings_block_patterns( $settings ) {
	$settings['__experimentalBlockPatterns']          = WP_Block_Patterns_Registry::get_instance()->get_all_registered();
	$settings['__experimentalBlockPatternCategories'] = WP_Block_Pattern_Categories_Registry::get_instance()->get_all_registered();

	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_extend_settings_block_patterns', 0 );


/**
 * Load a block pattern by name.
 *
 * @param string $name Block Pattern File name.
 *
 * @return array Block Pattern Array.
 */
function gutenberg_load_block_pattern( $name ) {
	return require( __DIR__ . '/patterns/' . $name . '.php' );
}

/**
 * Register default patterns and categories, potentially overriding ones that were already registered in Core.
 *
 * This can be removed when plugin support requires WordPress 5.5.0+, and patterns have been synced back to Core.
 *
 * @see https://core.trac.wordpress.org/ticket/50550
 */
function gutenberg_register_block_patterns() {
	$should_register_core_patterns = get_theme_support( 'core-block-patterns' );

	if ( $should_register_core_patterns ) {
		register_block_pattern( 'core/text-two-columns', gutenberg_load_block_pattern( 'text-two-columns' ) );
		register_block_pattern( 'core/two-buttons', gutenberg_load_block_pattern( 'two-buttons' ) );
		register_block_pattern( 'core/two-images', gutenberg_load_block_pattern( 'two-images' ) );
		register_block_pattern( 'core/text-two-columns-with-images', gutenberg_load_block_pattern( 'text-two-columns-with-images' ) );
		register_block_pattern( 'core/text-three-columns-buttons', gutenberg_load_block_pattern( 'text-three-columns-buttons' ) );
		register_block_pattern( 'core/large-header', gutenberg_load_block_pattern( 'large-header' ) );
		register_block_pattern( 'core/large-header-button', gutenberg_load_block_pattern( 'large-header-button' ) );
		register_block_pattern( 'core/three-buttons', gutenberg_load_block_pattern( 'three-buttons' ) );
		register_block_pattern( 'core/heading-paragraph', gutenberg_load_block_pattern( 'heading-paragraph' ) );
		register_block_pattern( 'core/quote', gutenberg_load_block_pattern( 'quote' ) );
	}

	register_block_pattern_category( 'buttons', array( 'label' => _x( 'Buttons', 'Block pattern category', 'gutenberg' ) ) );
	register_block_pattern_category( 'columns', array( 'label' => _x( 'Columns', 'Block pattern category', 'gutenberg' ) ) );
	register_block_pattern_category( 'gallery', array( 'label' => _x( 'Gallery', 'Block pattern category', 'gutenberg' ) ) );
	register_block_pattern_category( 'header', array( 'label' => _x( 'Headers', 'Block pattern category', 'gutenberg' ) ) );
	register_block_pattern_category( 'text', array( 'label' => _x( 'Text', 'Block pattern category', 'gutenberg' ) ) );
}
add_action( 'init', 'gutenberg_register_block_patterns' );
