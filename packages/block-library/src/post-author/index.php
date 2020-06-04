<?php
/**
 * Server-side rendering of the `core/post-author` block.
 *
 * @package WordPress
 */

/**
 * Build an array with CSS classes and inline styles defining the colors
 * which will be applied to the navigation markup in the front-end.
 *
 * @param  array $attributes Navigation block attributes.
 * @return array Colors CSS classes and inline styles.
 */
function post_author_build_css_colors( $attributes ) {
	$colors = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	// Text color.
	$has_named_text_color  = array_key_exists( 'textColor', $attributes );
	$has_custom_text_color = array_key_exists( 'customTextColor', $attributes );

	// If has text color.
	if ( $has_custom_text_color || $has_named_text_color ) {
		// Add has-text-color class.
		$colors['css_classes'][] = 'has-text-color';
	}

	if ( $has_named_text_color ) {
		// Add the color class.
		$colors['css_classes'][] = sprintf( 'has-%s-color', $attributes['textColor'] );
	} elseif ( $has_custom_text_color ) {
		// Add the custom color inline style.
		$colors['inline_styles'] .= sprintf( 'color: %s;', $attributes['customTextColor'] );
	}

	// Background color.
	$has_named_background_color  = array_key_exists( 'backgroundColor', $attributes );
	$has_custom_background_color = array_key_exists( 'customBackgroundColor', $attributes );

	if ( $has_named_background_color ) {
		// Add the background-color class.
		$colors['css_classes'][] = sprintf( 'has-%s-background-color', $attributes['backgroundColor'] );
	} elseif ( $has_custom_background_color ) {
		// Add the custom background-color inline style.
		$colors['inline_styles'] .= sprintf( 'background-color: %s;', $attributes['customBackgroundColor'] );
	}

	return $colors;
}

/**
 * Build an array with CSS classes and inline styles defining the font sizes
 * which will be applied to the navigation markup in the front-end.
 *
 * @param  array $attributes Navigation block attributes.
 * @return array Font size CSS classes and inline styles.
 */
function post_author_build_css_font_sizes( $attributes ) {
	// CSS classes.
	$name_font_sizes = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);
	$bio_font_sizes = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);
	$byline_font_sizes = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	$has_named_font_size  = array_key_exists( 'fontSize', $attributes );
	$has_custom_font_size = array_key_exists( 'customFontSize', $attributes );

	if ( $has_named_font_size ) {
		// Add the font size class.
		$name_font_sizes['css_classes'][] = sprintf( 'has-%s-font-size', $attributes['fontSize'] );
	} elseif ( $has_custom_font_size ) {
		// Add the custom font size inline style.
		$name_font_sizes['inline_styles'] = sprintf( 'font-size: %spx;', $attributes['customFontSize'] );
	}

	$has_named_bio_font_size  = array_key_exists( 'bioFontSize', $attributes );
	$has_custom_bio_font_size = array_key_exists( 'customBioFontSize', $attributes );

	if ( $has_named_bio_font_size ) {
		// Add the font size class.
		$bio_font_sizes['css_classes'][] = sprintf( 'has-%s-font-size', $attributes['bioFontSize'] );
	} elseif ( $has_custom_bio_font_size ) {
		// Add the custom font size inline style.
		$bio_font_sizes['inline_styles'] = sprintf( 'font-size: %spx;', $attributes['customBioFontSize'] );
	}

	$has_named_byline_font_size  = array_key_exists( 'bylineFontSize', $attributes );
	$has_custom_byline_font_size = array_key_exists( 'customBylineFontSize', $attributes );

	if ( $has_named_byline_font_size ) {
		// Add the font size class.
		$byline_font_sizes['css_classes'][] = sprintf( 'has-%s-font-size', $attributes['bylineFontSize'] );
	} elseif ( $has_custom_byline_font_size ) {
		// Add the custom font size inline style.
		$byline_font_sizes['inline_styles'] = sprintf( 'font-size: %spx;', $attributes['customBylineFontSize'] );
	}

	return array(
		'name'   => $name_font_sizes,
		'bio'    => $bio_font_sizes,
		'byline' => $byline_font_sizes,
	);
}

/**
 * Renders the `core/post-author` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the rendered author block.
 */
function render_block_core_post_author( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$author_id = get_post_field( 'post_author', $block->context['postId'] );
	if ( empty( $author_id ) ) {
		return '';
	}

	$avatar = ! empty( $attributes['avatarSize'] ) ? get_avatar(
		$author_id,
		$attributes['avatarSize']
	) : null;

	$byline     = ! empty( $attributes['byline'] ) ? $attributes['byline'] : false;
	$colors     = post_author_build_css_colors( $attributes );
	$font_sizes = post_author_build_css_font_sizes( $attributes );
	$classes    = array_merge(
		$colors['css_classes'],
		array( 'wp-block-post-author' ),
		isset( $attributes['className'] ) ? array( $attributes['className'] ) : array(),
		isset( $attributes['itemsJustification'] ) ? array( 'items-justified-' . $attributes['itemsJustification'] ) : array(),
		isset( $attributes['align'] ) ? array( 'align' . $attributes['align'] ) : array()
	);

	$class_attribute = sprintf( ' class="%s"', esc_attr( implode( ' ', $classes ) ) );
	$style_attribute = $colors['inline_styles'] ? sprintf( ' style="%s"', esc_attr( $colors['inline_styles'] ) ) : '';

	$name_class_attribute = sprintf( ' class="wp-block-post-author__name %s"', esc_attr( implode( ' ', $font_sizes['name']['css_classes'] ) ) );
	$name_style_attribute = $font_sizes['name']['inline_styles'] ? sprintf( 'style="%s"', esc_attr( $font_sizes['name']['inline_styles'] ) ) : '';

	$bio_class_attribute = sprintf( ' class="wp-block-post-author__bio %s"', esc_attr( implode( ' ', $font_sizes['bio']['css_classes'] ) ) );
	$bio_style_attribute = $font_sizes['bio']['inline_styles'] ? sprintf( 'style="%s"', esc_attr( $font_sizes['bio']['inline_styles'] ) ) : '';

	$byline_class_attribute = sprintf( ' class="wp-block-post-author__byline %s"', esc_attr( implode( ' ', $font_sizes['byline']['css_classes'] ) ) );
	$byline_style_attribute = $font_sizes['byline']['inline_styles'] ? sprintf( 'style="%s"', esc_attr( $font_sizes['byline']['inline_styles'] ) ) : '';

	return sprintf( '<div %1$s %2$s>', $class_attribute, $style_attribute ) .
		( ! empty( $attributes['showAvatar'] ) ? '<div class="wp-block-post-author__avatar">' . $avatar . '</div>' : '' ) .
		'<div class="wp-block-post-author__content">' .
			( ! empty( $byline ) ? sprintf( '<p %1$s %2$s>', $byline_class_attribute, $byline_style_attribute ) . $byline . '</p>' : '' ) .
			sprintf( '<p %1$s %2$s>', $name_class_attribute, $name_style_attribute ) . get_the_author_meta( 'display_name', $author_id ) . '</p>' .
			( ! empty( $attributes['showBio'] ) ? sprintf( '<p %1$s %2$s>', $bio_class_attribute, $bio_style_attribute ) . get_the_author_meta( 'user_description', $author_id ) . '</p>' : '' ) .
		'</div>' .
	'</div>';
}

/**
 * Registers the `core/post-author` block on the server.
 */
function register_block_core_post_author() {
	register_block_type_from_metadata(
		__DIR__ . '/post-author',
		array(
			'render_callback' => 'render_block_core_post_author',
		)
	);
}
add_action( 'init', 'register_block_core_post_author' );
