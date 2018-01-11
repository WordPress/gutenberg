<?php
/**
 * Server-side rendering of the `core/author` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/author` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the core author block rendered.
 */
function gutenberg_render_block_core_author( $attributes ) {
	$align = 'center';
	if ( in_array( $attributes['align'], array( 'left', 'right', 'full' ), true ) ) {
		$align = $attributes['align'];
	}

	$title_markup = $attributes['hideName'] ? '' : sprintf(
		'<h2>%1$s</h2>',
		esc_html( get_the_author_meta( 'display_name' ) )
	);

	$content_markup = '';
	if ( ! $attributes['hideAvatar'] || ! $attributes['hideBio'] ) {
		$img_markup = '';
		if ( ! $attributes['hideAvatar'] ) {
			$img_markup = sprintf(
				'<img src="%1$s" class="%2$s" />',
				esc_attr( get_avatar_url( get_the_author_meta( 'ID' ) ) ),
				$attributes['hideBio'] ? 'aligncenter' : 'alignleft'
			);
		}
		$content_markup .= sprintf(
			'<p>%1$s%2$s</p>',
			$img_markup,
			$attributes['hideBio'] ? '' : esc_html( strip_tags( get_the_author_meta( 'description' ) ) )
		);
	}
	$bio_class = $attributes['hideBio'] ? 'no-bio' : 'with-bio';
	$class     = "blocks-single-author align{$align} {$align} {$bio_class}";

	return sprintf(
		'<section class="%1$s">%2$s%3$s</section>',
		esc_attr( $class ),
		$title_markup,
		$content_markup
	);
}

register_block_type( 'core/author', array(
	'render_callback' => 'gutenberg_render_block_core_author',
	'attributes'      => array(
		'hideBio'    =>
			array(
				'type'    => 'boolean',
				'default' => false,
			),
		'hideAvatar' =>
			array(
				'type'    => 'boolean',
				'default' => false,
			),
		'hideName'   =>
			array(
				'type'    => 'boolean',
				'default' => false,
			),
		'align'      =>
			array(
				'type'    => 'string',
				'default' => 'center',
			),
	),

) );
