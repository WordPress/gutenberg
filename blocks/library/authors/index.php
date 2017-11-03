<?php
/**
 * Server-side rendering of the `core/authors` block.
 *
 * @package gutenberg
 */

/**
 * Renders a single author area.
 *
 * @param string $avatar The url of the author avatar.
 * @param string $bio    The bio/description of the author.
 * @param string $name   The display name of the author.
 * @param string $align  Alignment of the area.
 *
 * @return string Returns the single author area rendered.
 */
function gutenberg_render_block_core_authors_single_author( $avatar, $bio, $name, $align = 'center' ) {
	$title_markup = ! $name ? '' : sprintf(
		'<h2>%1$s</h2>',
		esc_html( $name )
	);

	$content_markup = '';
	if ( $avatar || $bio ) {
		$img_markup = '';
		if ( $avatar ) {
			$img_markup = sprintf(
				'<img src="%1$s" class="%2$s" />',
				esc_attr( $avatar ),
				$bio ? 'alignleft' : 'aligncenter'
			);
		}
		$content_markup .= sprintf(
			'<p>%1$s%2$s</p>',
			$img_markup,
			$bio ? esc_html( strip_tags( $bio ) ) : ''
		);
	}
	$bio_class = $bio ? 'withBio' : 'noBio';
	$class     = "blocks-single-author align{$align} {$bio_class}";

	return sprintf(
		'<section class="%1$s">%2$s%3$s</section>',
		esc_attr( $class ),
		$title_markup,
		$content_markup
	);
}

/**
 * Renders the `core/authors` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the core author block rendered.
 */
function gutenberg_render_block_core_authors( $attributes ) {
	$users          = get_users(
		array(
			role__in => array( 'administrator', 'editor', 'author' ),
			number   => 100,
		)
	);
	$content_markup = '';
	foreach ( $users as $user ) {
		$content_markup .= gutenberg_render_block_core_authors_single_author(
			$attributes['hideAvatar'] ? null : get_avatar_url( get_the_author_meta( $user->ID ) ),
			$attributes['hideBio'] ? null : get_the_author_meta( 'description', $user->ID ) ,
			$attributes['hideName'] ? null : get_the_author_meta( 'display_name', $user->ID )
		);
	}
	return sprintf(
		'<div class="wp-blocks-authors columns-%1$s">%2$s</div>',
		esc_attr( $attributes['columns'] ),
		$content_markup
	);
}





register_block_type( 'core/authors', array(
	'render_callback' => 'gutenberg_render_block_core_authors',
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
		'columns'    =>
			array(
				'type'    => 'number',
				'default' => 2,
			),
		'align'      =>
			array(
				'type'    => 'string',
				'default' => 'center',
			),
	),

) );
