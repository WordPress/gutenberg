<?php
/**
 * Server-side registration of `core/embed` and `core-embed/` block types.
 *
 * @package gutenberg
 */

/**
 * Registers the `core/embed` block on the server-side.
 *
 * @since 2.7.0
 */
function register_core_embed_block_types() {

	$common_embed_block_types = array(
		'core-embed/twitter',
		'core-embed/youtube',
		'core-embed/facebook',
		'core-embed/instagram',
		'core-embed/wordpress',
		'core-embed/soundcloud',
		'core-embed/spotify',
		'core-embed/flickr',
		'core-embed/vimeo',
	);

	$other_embed_block_types = array(
		'core-embed/animoto',
		'core-embed/cloudup',
		'core-embed/collegehumor',
		'core-embed/dailymotion',
		'core-embed/funnyordie',
		'core-embed/hulu',
		'core-embed/imgur',
		'core-embed/issuu',
		'core-embed/kickstarter',
		'core-embed/meetup-com',
		'core-embed/mixcloud',
		'core-embed/photobucket',
		'core-embed/polldaddy',
		'core-embed/reddit',
		'core-embed/reverbnation',
		'core-embed/screencast',
		'core-embed/scribd',
		'core-embed/slideshare',
		'core-embed/smugmug',
		'core-embed/speaker',
		'core-embed/ted',
		'core-embed/tumblr',
		'core-embed/videopress',
		'core-embed/wordpress-tv',
	);

	wp_register_script(
		'core-embed-block',
		gutenberg_url( '/build/__block_embed.js' ),
		array( 'wp-blocks', 'wp-i18n', 'wp-components', 'wp-element' )
	);

	wp_register_style(
		'core-embed-block',
		gutenberg_url( '/build/__block_embed.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_embed.css' )
	);

	wp_style_add_data( 'core-embed-block', 'rtl', 'replace' );

	wp_register_style(
		'core-embed-block-editor',
		gutenberg_url( '/build/__block_embed_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_embed_editor.css' )
	);

	wp_style_add_data( 'core-embed-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/embed', array(
		'style'         => 'core-embed-block',
		'editor_style'  => 'core-embed-block-editor',
		'editor_script' => 'core-embed-block',
	) );

	foreach ( $common_embed_block_types as $embed_block_type_name ) {
		register_block_type( $embed_block_type_name, array(
			'style'         => 'core-embed-block',
			'editor_style'  => 'core-embed-block-editor',
			'editor_script' => 'core-embed-block',
		) );
	}

	foreach ( $other_embed_block_types as $embed_block_type_name ) {
		register_block_type( $embed_block_type_name, array(
			'style'         => 'core-embed-block',
			'editor_style'  => 'core-embed-block-editor',
			'editor_script' => 'core-embed-block',
		) );
	}
}

add_action( 'init', 'register_core_embed_block_types' );
