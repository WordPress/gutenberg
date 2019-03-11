<?php
/**
 * Server-side rendering of the `core-embed/youtube` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core-embed/youtube` block on server with support for extra embed
 * options that are not available through oEmbed.
 *
 * @param array $attributes The block attributes.
 * @param array $content The content rendered by oEmbed.
 *
 * @return string Returns the embedded content with extra options applied.
 */
function render_block_core_embed_youtube( $attributes, $content ) {
	$extra = '';
	if ( ! isset( $attributes['extraOptions'] ) ) {
		return $content;
	}
	if ( isset( $attributes['extraOptions']['autoplay'] ) && $attributes['extraOptions']['autoplay'] ) {
		$extra .= '&autoplay=1';
	}
	if ( isset( $attributes['extraOptions']['relatedOnlyFromChannel'] ) && $attributes['extraOptions']['relatedOnlyFromChannel'] ) {
		$extra .= '&rel=0';
	}
	if ( isset( $attributes['extraOptions']['start'] ) && $attributes['extraOptions']['start'] > 0 ) {
		$extra .= '&start=' . intval( $attributes['extraOptions']['start'] );
	}
	$content = str_replace( 'feature=oembed', 'feature=oembed' . $extra, $content );
	return $content;
}

/**
 * Register youtube block so we can enhance the oEmbed rendered content.
 */
function register_block_core_embed_youtube() {
	register_block_type(
		'core-embed/youtube',
		array(
			'attributes'      => array(),
			'render_callback' => 'render_block_core_embed_youtube',
		)
	);
}

add_action( 'init', 'register_block_core_embed_youtube' );
