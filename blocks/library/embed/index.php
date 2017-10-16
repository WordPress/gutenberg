<?php
/**
 * Server-side rendering of the `core-embed` blocks.
 *
 * @package gutenberg
 */

register_block_type( 'core-embed/twitter', array(
	'attributes'      => array(
		'url'         => array(
			'type'    => 'string',
		),
		'theme'       => array(
			'type'    => 'string',
			'default' => 'light',
		),
	),

	'render_callback' => 'gutenberg_render_block_core_embed_twitter',
) );

/**
 * Given a core embed block's attributes, content, and an array of additional
 * attributes to include in the oEmbed fetch URL, returns a rendering of the
 * embed block with extra arguments encoded in the [embed] shortcode.
 *
 * @param  array  $attributes  Block attributes.
 * @param  string $raw_content Block inner content.
 * @param  array  $extra_args  Additional oEmbed attributes.
 * @return string              Embed block with extra arguments encoded.
 */
function gutenberg_render_block_core_embed( $attributes, $raw_content, $extra_args ) {
	if ( empty( $attributes['url'] ) ) {
		return $raw_content;
	}

	$embed = sprintf(
		'[embed args="%s"]%s[/embed]',
		http_build_query( $attributes ),
		$raw_content
	);

	return str_replace( $attributes['url'], $embed, $raw_content );
}

/**
 * Given a core embed Twitter block, returns a rendering of the embed block.
 *
 * @see gutenberg_render_block_core_embed()
 *
 * @param  array  $attributes  Block attributes.
 * @param  string $raw_content Block inner content.
 * @return string              Embed block with extra arguments encoded.
 */
function gutenberg_render_block_core_embed_twitter( $attributes, $raw_content ) {
	$extra_args = array();
	if ( 'dark' === $attributes['theme'] ) {
		$extra_args['theme'] = 'dark';
	}

	return gutenberg_render_block_core_embed( $attributes, $raw_content, $extra_args );

}

/**
 * Filters oEmbed fetch URL to include extra arguments from an [embed] shortcode.
 *
 * @param  string $provider URL of the oEmbed provider.
 * @param  string $url      URL of the content to be embedded.
 * @param  array  $args     Optional arguments, usually passed from a shortcode.
 * @return string           oEmbed provider with extra arguments included.
 */
function gutenberg_oembed_add_extra_params( $provider, $url, $args ) {
	if ( ! empty( $args['args'] ) ) {
		wp_parse_str( $args['args'], $extra_args );
		$provider = add_query_arg( $extra_args, $provider );
	}

	return $provider;
}
add_filter( 'oembed_fetch_url', 'gutenberg_oembed_add_extra_params', 10, 3 );
