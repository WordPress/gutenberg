<?php
/**
 * Server-side rendering of the `core/post-navigation-link` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-navigation-link` block on the server.
 *
 * @since 5.9.0
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block default content.
 *
 * @return string Returns the next or previous post link that is adjacent to the current post.
 */
function render_block_core_post_navigation_link( $attributes, $content ) {
	if ( ! is_singular() ) {
		return '';
	}

	// Get the navigation type to show the proper link. Available options are `next|previous`.
	$navigation_type = isset( $attributes['type'] ) ? $attributes['type'] : 'next';
	// Allow only `next` and `previous` in `$navigation_type`.
	if ( ! in_array( $navigation_type, array( 'next', 'previous' ), true ) ) {
		return '';
	}
	$classes = "post-navigation-link-$navigation_type";
	if ( isset( $attributes['textAlign'] ) ) {
		$classes .= " has-text-align-{$attributes['textAlign']}";
	}

	$support_styles = get_block_core_post_navigation_link_border_and_spacing_attributes( $attributes );
	$classes .= ! empty( $support_styles['class'] ) ? " {$support_styles['class']}" : '';

	// Get the wrapper attributes.
	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class' => $classes,
			'style' => $support_styles['style'],
		)
	);
	// Set default values.
	$format = '%link';
	$link   = 'next' === $navigation_type ? _x( 'Next', 'label for next post link' ) : _x( 'Previous', 'label for previous post link' );
	$label  = '';

	// Only use hardcoded values here, otherwise we need to add escaping where these values are used.
	$arrow_map = array(
		'none'    => '',
		'arrow'   => array(
			'next'     => '→',
			'previous' => '←',
		),
		'chevron' => array(
			'next'     => '»',
			'previous' => '«',
		),
	);

	// If a custom label is provided, make this a link.
	// `$label` is used to prepend the provided label, if we want to show the page title as well.
	if ( isset( $attributes['label'] ) && ! empty( $attributes['label'] ) ) {
		$label = "{$attributes['label']}";
		$link  = $label;
	}

	// If we want to also show the page title, make the page title a link and prepend the label.
	if ( isset( $attributes['showTitle'] ) && $attributes['showTitle'] ) {
		/*
		 * If the label link option is not enabled but there is a custom label,
		 * display the custom label as text before the linked title.
		 */
		if ( ! $attributes['linkLabel'] ) {
			if ( $label ) {
				$format = '<span class="post-navigation-link__label">' . wp_kses_post( $label ) . '</span> %link';
			}
			$link = '%title';
		} elseif ( isset( $attributes['linkLabel'] ) && $attributes['linkLabel'] ) {
			// If the label link option is enabled and there is a custom label, display it before the title.
			if ( $label ) {
				$link = '<span class="post-navigation-link__label">' . wp_kses_post( $label ) . '</span> <span class="post-navigation-link__title">%title</span>';
			} else {
				/*
				 * If the label link option is enabled and there is no custom label,
				 * add a colon between the label and the post title.
				 */
				$label = 'next' === $navigation_type ? _x( 'Next:', 'label before the title of the next post' ) : _x( 'Previous:', 'label before the title of the previous post' );
				$link  = sprintf(
					'<span class="post-navigation-link__label">%1$s</span> <span class="post-navigation-link__title">%2$s</span>',
					wp_kses_post( $label ),
					'%title'
				);
			}
		}
	}

	// Display arrows.
	if ( isset( $attributes['arrow'] ) && 'none' !== $attributes['arrow'] && isset( $arrow_map[ $attributes['arrow'] ] ) ) {
		$arrow = $arrow_map[ $attributes['arrow'] ][ $navigation_type ];

		if ( 'next' === $navigation_type ) {
			$format = '%link<span class="wp-block-post-navigation-link__arrow-next is-arrow-' . $attributes['arrow'] . '" aria-hidden="true">' . $arrow . '</span>';
		} else {
			$format = '<span class="wp-block-post-navigation-link__arrow-previous is-arrow-' . $attributes['arrow'] . '" aria-hidden="true">' . $arrow . '</span>%link';
		}
	}

	/*
	 * The dynamic portion of the function name, `$navigation_type`,
	 * Refers to the type of adjacency, 'next' or 'previous'.
	 *
	 * @see https://developer.wordpress.org/reference/functions/get_previous_post_link/
	 * @see https://developer.wordpress.org/reference/functions/get_next_post_link/
	 */
	$get_link_function = "get_{$navigation_type}_post_link";

	if ( ! empty( $attributes['taxonomy'] ) ) {
		$content = $get_link_function( $format, $link, true, '', $attributes['taxonomy'] );
	} else {
		$content = $get_link_function( $format, $link );
	}

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$content
	);
}

/**
 * Generates class names and styles to apply the border support styles for
 * the Post Navigation Link block.
 *
 * @since 6.7.0
 *
 * @param array $attributes The block attributes.
 * @return array The border-related classnames and styles for the block.
 */
function get_block_core_post_navigation_link_border_and_spacing_attributes( $attributes ) {
	$border_styles = array();
	$sides         = array( 'top', 'right', 'bottom', 'left' );

	// Border radius.
	if ( isset( $attributes['style']['border']['radius'] ) ) {
		$border_styles['radius'] = $attributes['style']['border']['radius'];
	}

	// Border style.
	if ( isset( $attributes['style']['border']['style'] ) ) {
		$border_styles['style'] = $attributes['style']['border']['style'];
	}

	// Border width.
	if ( isset( $attributes['style']['border']['width'] ) ) {
		$border_styles['width'] = $attributes['style']['border']['width'];
	}

	// Border color.
	$preset_color           = array_key_exists( 'borderColor', $attributes ) ? "var:preset|color|{$attributes['borderColor']}" : null;
	$custom_color           = $attributes['style']['border']['color'] ?? null;
	$border_styles['color'] = $preset_color ? $preset_color : $custom_color;

	// Individual border styles e.g. top, left etc.
	foreach ( $sides as $side ) {
		$border                 = $attributes['style']['border'][ $side ] ?? null;
		$border_styles[ $side ] = array(
			'color' => isset( $border['color'] ) ? $border['color'] : null,
			'style' => isset( $border['style'] ) ? $border['style'] : null,
			'width' => isset( $border['width'] ) ? $border['width'] : null,
		);
	}

	// Individual padding styles e.g. top, left etc.
	$padding_style = array();
	foreach ( $sides as $side ) {
		$padding_style[ $side ] = $attributes['style']['spacing']['padding'][ $side ] ?? null;
	}

	// Individual padding styles e.g. top, left etc.
	$margin_style = array();
	foreach ( $sides as $side ) {
		$margin_style[ $side ] = $attributes['style']['spacing']['margin'][ $side ] ?? null;
	}

	$styles     = wp_style_engine_get_styles(
		array(
			'border'  => $border_styles,
			'spacing' => array(
				'padding' => $padding_style,
				'margin'  => $margin_style,
			),
		)
	);
	$attributes = array();
	if ( ! empty( $styles['classnames'] ) ) {
		$attributes['class'] = $styles['classnames'];
	}
	if ( ! empty( $styles['css'] ) ) {
		$attributes['style'] = $styles['css'];
	}
	return $attributes;
}

/**
 * Registers the `core/post-navigation-link` block on the server.
 *
 * @since 5.9.0
 */
function register_block_core_post_navigation_link() {
	register_block_type_from_metadata(
		__DIR__ . '/post-navigation-link',
		array(
			'render_callback' => 'render_block_core_post_navigation_link',
		)
	);
}
add_action( 'init', 'register_block_core_post_navigation_link' );
