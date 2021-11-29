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
