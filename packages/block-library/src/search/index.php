<?php
/**
 * Server-side rendering of the `core/search` block.
 *
 * @package WordPress
 */

/**
 * Dynamically renders the `core/search` block.
 *
 * @param array $attributes The block attributes.
 *
 * @return string The search block markup.
 */
function render_block_core_search( $attributes ) {
	static $instance_id = 0;

	// Older versions of the Search block defaulted the label and buttonText
	// attributes to `__( 'Search' )` meaning that many posts contain `<!--
	// wp:search /-->`. Support these by defaulting an undefined label and
	// buttonText to `__( 'Search' )`.
	$attributes = wp_parse_args(
		$attributes,
		array(
			'label'		 => __( 'Search' ),
			'buttonText' => __( 'Search' ),
		)
	);

	$input_id			= 'wp-block-search__input-' . ++$instance_id;
	$base_classnames	= block_core_build_base_classnames( $attributes );
	$show_label			= array_key_exists( 'showLabel', $attributes );
	$use_icon_button	= array_key_exists( 'buttonUseIcon', $attributes ) && $attributes['buttonUseIcon'];
	$has_width			= array_key_exists( 'width', $attributes );
	$has_width_unit		= array_key_exists( 'widthUnit', $attributes );
	$show_input			= array_key_exists( 'buttonPosition', $attributes ) && 'button-only' === $attributes['buttonPosition'] ? false : true;
	$show_button		= array_key_exists( 'buttonPosition', $attributes ) && 'no-button' === $attributes['buttonPosition'] ? false : true;
	$label_markup		= '';
	$input_markup		= '';
	$button_markup		= '';

	$shared_classes		= block_core_search_build_css_border_radius( $attributes )['css_classes'];
	$shared_styles		= block_core_search_build_css_border_radius( $attributes )['inline_styles'];

	if ( $show_label ) {
		if ( ! empty( $attributes['label'] ) ) {
			$label_markup = sprintf(
				'<label for="%s" class="wp-block-search__label">%s</label>',
				$input_id,
				$attributes['label']
			);
		} else {
			$label_markup = sprintf(
				'<label for="%s" class="wp-block-search__label screen-reader-text">%s</label>',
				$input_id,
				__( 'Search' )
			);
		}
	}

	if ( $show_input ) {
		$input_classes = array_merge(
			array( 'wp-block-search__input' ),
			array_filter( $shared_classes )
		);
		$input_styles = $shared_styles;

		$input_markup = sprintf(
			'<input type="search" id="%1$s" %2$s%3$sname="s" value="%4$s" placeholder="%5$s" required />',
			esc_attr( $input_id ),
			sprintf( ' class="%s"', esc_attr( implode( ' ', $input_classes ) ) ),
			( ! empty( $input_styles ) ) ? sprintf( ' style="%s"', esc_attr( $input_styles ) ) : '',
			esc_attr( get_search_query() ),
			esc_attr( $attributes['placeholder'] )
		);
	}

	if ( $show_button ) {
		$button_classes = array_merge(
			array( 'wp-block-search__button' ),
			array_filter( $shared_classes )
		);
		$button_styles = $shared_styles;
		$button_internal_markup = '';

		if ( ! $use_icon_button ) {
			if ( ! empty( $attributes['buttonText'] ) ) {
				$button_internal_markup = $attributes['buttonText'];
			}
		} else {
			$button_internal_markup =
				'<svg id="search-icon" class="search-icon" viewBox="0 0 24 24">
			        <path d="M13.5 6C10.5 6 8 8.5 8 11.5c0 1.1.3 2.1.9 3l-3.4 3 1 1.1 3.4-2.9c1 .9 2.2 1.4 3.6 1.4 3 0 5.5-2.5 5.5-5.5C19 8.5 16.5 6 13.5 6zm0 9.5c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"></path>
			    </svg>';
		}

		$button_markup = sprintf(
			'<button type="submit"%1$s%2$s>%3$s</button>',
			sprintf( ' class="%s"', esc_attr( implode( ' ', $button_classes ) ) ),
			( ! empty( $button_styles ) ) ? sprintf( ' style="%s"', esc_attr( $button_styles ) ) : '',
			$button_internal_markup
		);
	}

	$field_classes = array_merge(
		array( 'wp-block-search__inside-wrapper' ),
		( array_key_exists( 'buttonPosition', $attributes ) && 'button-inside' === $attributes['buttonPosition'] )
			? array_filter( $shared_classes )
			: array()
	);
	$field_styles = ( array_key_exists( 'buttonPosition', $attributes ) && 'button-inside' === $attributes['buttonPosition'] )
		? $shared_styles
		: '';

	if ( ! empty( $attributes['width'] ) && ! empty( $attributes['widthUnit'] ) ) {
		if ( ! empty( $attributes['buttonPosition'] ) && 'button-only' !== $attributes['buttonPosition'] ) {
			$field_styles .= ' width: ' . esc_attr( $attributes['width'] ) . esc_attr( $attributes['widthUnit'] ) . ';';
		}
	}

	$field_markup = sprintf(
		'<div %1$s%2$s>%3$s</div>',
		sprintf( ' class="%s"', esc_attr( implode( ' ', $field_classes ) ) ),
		( ! empty( $field_styles ) ) ? sprintf( ' style="%s"', esc_attr( $field_styles ) ) : '',
		$input_markup . $button_markup
	);

	return sprintf(
		'<form role="search" method="get" action="%s" class="%s">%s</form>',
		esc_url( home_url( '/' ) ),
		esc_attr( implode( ' ', $base_classnames ) ),
		$label_markup . $field_markup
	);
}

/**
 * Registers the `core/search` block on the server.
 */
function register_block_core_search() {
	register_block_type_from_metadata(
		__DIR__ . '/search',
		array(
			'render_callback' => 'render_block_core_search',
		)
	);
}
add_action( 'init', 'register_block_core_search' );

/**
 * Build an array with CSS classes and inline styles defining the border radius
 * which will be applied to the search markup in the front-end.
 *
 * @param  array $attributes Search block attributes.
 * @return array Border radius CSS classes and inline styles.
 */
function block_core_search_build_css_border_radius( $attributes ) {
	$border_radius = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	$has_border_radius  = array_key_exists( 'borderRadius', $attributes );

	if ( $has_border_radius ) {
		$border_radius['css_classes'][] = ( $attributes['borderRadius'] === 0 )
			? 'no-border-radius'
			: '';

		$border_radius['inline_styles'] = sprintf(
			'border-radius: %spx;',
			esc_attr( $attributes['borderRadius'] )
		);
	}

	return $border_radius;
}

/**
 * Builds the correct top level classnames for the 'core/search' block.
 *
 * @param array $attributes The block attributes.
 *
 * @return string The classnames used in the block.
 */
function block_core_build_base_classnames( $attributes ) {
	$classnames = array();

	if ( array_key_exists( 'buttonPosition', $attributes ) ) {
		if ( 'button-inside' === $attributes['buttonPosition'] ) {
			$classnames[] = 'wp-block-search__button-inside';
		}

		if ( 'button-outside' === $attributes['buttonPosition'] ) {
			$classnames[] = 'wp-block-search__button-outside';
		}

		if ( 'no-button' === $attributes['buttonPosition'] ) {
			$classnames[] = 'wp-block-search__no-button';
		}

		if ( 'button-only' === $attributes['buttonPosition'] ) {
			$classnames[] = 'wp-block-search__button-only';
		}
	}

	if ( isset( $attributes['buttonUseIcon'] ) ) {
		if ( array_key_exists( 'buttonPosition', $attributes ) && 'no-button' !== $attributes['buttonPosition'] ) {
			if ( $attributes['buttonUseIcon'] ) {
				$classnames[] = 'wp-block-search__icon-button';
			} else {
				$classnames[] = 'wp-block-search__text-button';
			}
		}
	}

	return $classnames;
}
