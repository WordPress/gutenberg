<?php
/**
 * Server-side rendering of the `core/slider` block.
 *
 * @package WordPress
 */

/**
 * Returns SVG path data for slider pagination button icons.
 *
 * @param string $arrow_icon  Icon style.
 * @param bool   $is_previous Whether this is previous button.
 * @return string
 */
function block_core_slider_get_pagination_icon_path( $arrow_icon, $is_previous ) {
	$paths = array(
		'chevron' => array(
			'previous' => 'M14.6 7l-1.2-1L8 12l5.4 6 1.2-1-4.6-5z',
			'next'     => 'M10.6 6L9.4 7l4.6 5-4.6 5 1.2 1 5.4-6z',
		),
		'arrow'   => array(
			'previous' => 'M20 11.2H6.8l3.7-3.7-1-1L3.9 12l5.6 5.5 1-1-3.7-3.7H20z',
			'next'     => 'm14.5 6.5-1 1 3.7 3.7H4v1.6h13.2l-3.7 3.7 1 1 5.6-5.5z',
		),
	);

	$icon_paths = $paths[ $arrow_icon ] ?? $paths['chevron'];
	$direction  = $is_previous ? 'previous' : 'next';

	return $icon_paths[ $direction ];
}

/**
 * Builds the HTML attribute string for an internal (non-block-wrapper) element.
 *
 * Unlike get_block_wrapper_attributes(), this helper is safe to call multiple
 * times and does not inject block-level classes or data attributes.
 *
 * @param array $attributes Key-value pairs of HTML attributes.
 * @return string Space-prefixed attribute string, e.g. ' class="foo" type="button"'.
 */
function block_core_slider_build_attrs( $attributes ) {
	$html = '';
	foreach ( $attributes as $key => $value ) {
		$html .= ' ' . esc_attr( $key ) . '="' . esc_attr( $value ) . '"';
	}
	return $html;
}

/**
 * Renders a combined control bar when arrows and indicators share an in-flow
 * position: <prev> <indicators> <next>.
 *
 * @param string $arrow_icon             Icon style: 'chevron' or 'arrow'.
 * @param string $navigation_button_type Button content: 'icon', 'text', or 'both'.
 * @param string $indicator_style        Style of the indicator dots: 'dot' or 'line'.
 * @param string $position               Shared position: 'top' or 'bottom'.
 * @param bool   $show_arrows            Whether to render the prev/next buttons.
 * @param bool   $show_indicators        Whether to render the indicator dots.
 * @return string HTML string for the control bar.
 */
function block_core_slider_render_control_bar_markup( $arrow_icon, $navigation_button_type, $indicator_style, $position, $show_arrows, $show_indicators ) {
	$content = '';

	if ( $show_arrows ) {
		$content .= block_core_slider_render_arrow_button_markup( $arrow_icon, $navigation_button_type, true );
	}

	if ( $show_indicators ) {
		$content .= '<div class="wp-block-slider-indicators__dots is-style-' . esc_attr( $indicator_style ) . '" data-wp-interactive="core/slider"><template data-wp-each="state.dots" data-wp-each-key="context.item"><button type="button" class="wp-block-slider-indicators__dot" data-wp-on--click="actions.goToSlide" data-wp-bind--aria-current="state.isDotActive" data-wp-bind--aria-label="state.dotLabel"></button></template></div>';
	}

	if ( $show_arrows ) {
		$content .= block_core_slider_render_arrow_button_markup( $arrow_icon, $navigation_button_type, false );
	}

	return '<div class="wp-block-slider-control-bar is-position-' . esc_attr( $position ) . '">' . $content . '</div>';
}

/**
 * Renders a single arrow button (previous or next).
 *
 * @param string $arrow_icon             Icon style: 'chevron' or 'arrow'.
 * @param string $navigation_button_type Button content: 'icon', 'text', or 'both'.
 * @param bool   $is_previous            True for the previous button, false for next.
 * @return string HTML string for the button.
 */
function block_core_slider_render_arrow_button_markup( $arrow_icon, $navigation_button_type, $is_previous ) {
	$type        = $is_previous ? 'previous' : 'next';
	$button_text = $is_previous ? __( 'Previous' ) : __( 'Next' );
	$label       = $is_previous ? __( 'Previous slide' ) : __( 'Next slide' );

	$icon_svg  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" class="wp-block-slider-arrows-button__icon"><path d="' . esc_attr( block_core_slider_get_pagination_icon_path( $arrow_icon, $is_previous ) ) . '" /></svg>';
	$text_span = '<span class="wp-block-slider-arrows-button__text">' . esc_html( $button_text ) . '</span>';

	if ( 'icon' === $navigation_button_type ) {
		$button_inner = $icon_svg;
	} elseif ( 'text' === $navigation_button_type ) {
		$button_inner = $text_span;
	} elseif ( $is_previous ) {
		$button_inner = $icon_svg . $text_span;
	} else {
		$button_inner = $text_span . $icon_svg;
	}

	$btn_attrs = array(
		'class'                       => sprintf(
			'wp-block-slider-arrows-button is-type-%s is-icon-%s',
			sanitize_html_class( $type ),
			sanitize_html_class( $arrow_icon )
		),
		'type'                        => 'button',
		'data-wp-interactive'         => 'core/slider',
		'data-wp-on--click'           => $is_previous ? 'actions.prevSlide' : 'actions.nextSlide',
		'data-wp-bind--aria-disabled' => $is_previous ? 'state.isAtStart' : 'state.isAtEnd',
	);

	if ( 'icon' === $navigation_button_type ) {
		$btn_attrs['aria-label'] = $label;
	}

	return '<button' . block_core_slider_build_attrs( $btn_attrs ) . '>' . $button_inner . '</button>';
}

/**
 * Renders the arrows markup (previous/next buttons) for the slider.
 *
 * @param string $arrow_icon             Icon style: 'chevron' or 'arrow'.
 * @param string $navigation_button_type Button content: 'icon', 'text', or 'both'.
 * @param string $arrows_position        Where arrows are placed.
 * @return string HTML string for the arrows container, or empty string when hidden.
 */
function block_core_slider_render_arrows_markup( $arrow_icon, $navigation_button_type, $arrows_position ) {
	if ( 'none' === $arrows_position ) {
		return '';
	}

	$button_html  = block_core_slider_render_arrow_button_markup( $arrow_icon, $navigation_button_type, true );
	$button_html .= block_core_slider_render_arrow_button_markup( $arrow_icon, $navigation_button_type, false );

	return '<div class="wp-block-slider-arrows is-position-' . esc_attr( $arrows_position ) . '">' . $button_html . '</div>';
}

/**
 * Renders the indicators markup (dot/line buttons) for the slider.
 *
 * @param string $indicator_style     Style of the indicator dots: 'dot' or 'line'.
 * @param string $indicators_position Where indicators are placed.
 * @return string HTML string for the indicators container, or empty string when hidden.
 */
function block_core_slider_render_indicators_markup( $indicator_style, $indicators_position ) {
	if ( 'none' === $indicators_position ) {
		return '';
	}

	$dots_html = '<div class="wp-block-slider-indicators__dots is-style-' . esc_attr( $indicator_style ) . '" data-wp-interactive="core/slider"><template data-wp-each="state.dots" data-wp-each-key="context.item"><button type="button" class="wp-block-slider-indicators__dot" data-wp-on--click="actions.goToSlide" data-wp-bind--aria-current="state.isDotActive" data-wp-bind--aria-label="state.dotLabel"></button></template></div>';

	return '<div class="wp-block-slider-indicators is-position-' . esc_attr( $indicators_position ) . '">' . $dots_html . '</div>';
}

/**
 * Renders the `core/slider` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the block markup.
 */
function render_block_core_slider( $attributes, $content, $block ) {
	$slides_content = '';
	$other_content  = '';
	$slide_count    = 0;

	if ( $block instanceof WP_Block ) {
		foreach ( $block->inner_blocks as $inner_block ) {
			$rendered_inner_block = $inner_block->render();

			if ( '' === $rendered_inner_block ) {
				continue;
			}

			if ( 'core/slide' === $inner_block->name ) {
				$slides_content .= $rendered_inner_block;
				++$slide_count;
				continue;
			}

			$other_content .= $rendered_inner_block;
		}
	}

	// If there are no slides, do not render the slider block.
	if ( 0 === $slide_count ) {
		return '';
	}

	$p           = new WP_HTML_Tag_Processor( $slides_content );
	$slide_index = 0;

	while ( $p->next_tag( array( 'class_name' => 'wp-block-slide' ) ) ) {
		++$slide_index;
		$p->set_attribute( 'role', 'group' );
		$p->set_attribute( 'aria-roledescription', 'slide' );
		$p->set_attribute(
			'aria-label',
			sprintf(
				/* translators: 1: Slide number, 2: Total number of slides. */
				__( 'Slide %1$d of %2$d' ),
				$slide_index,
				$slide_count
			)
		);

		if ( 1 === $slide_index ) {
			$p->remove_attribute( 'inert' );
		} else {
			$p->set_attribute( 'inert', '' );
		}
	}

	$track_markup = sprintf(
		'<div class="wp-block-slider-track" data-wp-on--scroll="actions.handleScroll" data-wp-init="callbacks.initTrack" tabindex="0" aria-label="%1$s">%2$s</div>',
		esc_attr__( 'Slides' ),
		$p->get_updated_html()
	);

	$arrow_icon             = $attributes['arrowIcon'] ?? 'chevron';
	$indicator_style        = $attributes['indicatorStyle'] ?? 'dot';
	$navigation_button_type = $attributes['navigationButtonType'] ?? 'icon';
	$arrows_position        = $attributes['arrowsPosition'] ?? 'overlay';
	$indicators_position    = $attributes['indicatorsPosition'] ?? 'overlay';

	$positioned_positions = array( 'overlay', 'sides' );
	$flow_positions       = array( 'top', 'bottom' );

	$arrows_in_flow     = in_array( $arrows_position, $flow_positions, true );
	$indicators_in_flow = in_array( $indicators_position, $flow_positions, true );

	// When arrows and indicators share the same in-flow position, emit a single
	// combined control bar: [prev] [indicators] [next].
	$shared_in_flow_position = ( $arrows_in_flow && $indicators_in_flow && $arrows_position === $indicators_position )
		? $arrows_position
		: null;

	if ( null !== $shared_in_flow_position ) {
		$control_bar_markup = block_core_slider_render_control_bar_markup(
			$arrow_icon,
			$navigation_button_type,
			$indicator_style,
			$shared_in_flow_position,
			'none' !== $arrows_position,
			'none' !== $indicators_position
		);
		$before_track = 'top' === $shared_in_flow_position ? $control_bar_markup : '';
		$after_track  = 'bottom' === $shared_in_flow_position ? $control_bar_markup : '';
	} else {
		$arrows_markup     = block_core_slider_render_arrows_markup( $arrow_icon, $navigation_button_type, $arrows_position );
		$indicators_markup = block_core_slider_render_indicators_markup( $indicator_style, $indicators_position );

		$before_track = '';
		$after_track  = '';

		if ( $arrows_in_flow ) {
			if ( 'top' === $arrows_position ) {
				$before_track .= $arrows_markup;
			} else {
				$after_track .= $arrows_markup;
			}
		}
		if ( $indicators_in_flow ) {
			if ( 'top' === $indicators_position ) {
				$before_track .= $indicators_markup;
			} else {
				$after_track .= $indicators_markup;
			}
		}
	}

	// Positioned (overlay/sides) elements are absolute siblings of the track.
	$positioned_markup = '';
	if ( in_array( $arrows_position, $positioned_positions, true ) ) {
		$positioned_markup .= block_core_slider_render_arrows_markup( $arrow_icon, $navigation_button_type, $arrows_position );
	}
	if ( in_array( $indicators_position, $positioned_positions, true ) ) {
		$positioned_markup .= block_core_slider_render_indicators_markup( $indicator_style, $indicators_position );
	}

	$rendered_content = $before_track . $track_markup . $positioned_markup . $after_track . $other_content;

	$slides_to_show = isset( $attributes['slidesToShow'] ) ? (int) $attributes['slidesToShow'] : 1;
	$slides_to_show = max( 1, min( $slides_to_show, $slide_count ) );

	$context = array(
		'currentIndex' => 0,
		'totalSlides'  => $slide_count,
		'slidesToShow' => $slides_to_show,
		'hasFocus'     => false,
		'loop'         => isset( $attributes['loop'] ) ? (bool) $attributes['loop'] : true,
	);

	wp_interactivity_config(
		'core/slider',
		array(
			/* translators: 1: Current slide number, 2: Total number of slides. */
			'slideLabelTemplate' => __( 'Slide %1$d of %2$d' ),
		)
	);

	$aria_label = ! empty( $attributes['ariaLabel'] ) ? $attributes['ariaLabel'] : __( 'Slider' );

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class'                => 'is-arrows-position-' . sanitize_html_class( $arrows_position ) . ' is-indicators-position-' . sanitize_html_class( $indicators_position ),
			'data-wp-interactive'  => 'core/slider',
			'data-wp-context'      => wp_json_encode( $context ),
			'data-wp-on--focusin'  => 'actions.handleFocusIn',
			'data-wp-on--focusout' => 'actions.handleFocusOut',
			'style'                => "--wp--slider-slides-to-show: {$slides_to_show}",
			'role'                 => 'region',
			'aria-roledescription' => 'carousel',
			'aria-label'           => $aria_label,
		)
	);

	// Add a visually hidden live region for screen readers.
	$live_region = '<div class="screen-reader-text" aria-live="off" aria-atomic="true" data-wp-bind--aria-live="state.ariaLive" data-wp-bind--text="state.currentSlideLabel"></div>';

	return sprintf(
		'<div %1$s>%2$s%3$s</div>',
		$wrapper_attributes,
		$rendered_content,
		$live_region
	);
}

/**
 * Registers the `core/slider` block on the server.
 */
function register_block_core_slider() {
	register_block_type_from_metadata(
		__DIR__ . '/slider',
		array(
			'render_callback' => 'render_block_core_slider',
		)
	);
}
add_action( 'init', 'register_block_core_slider' );
