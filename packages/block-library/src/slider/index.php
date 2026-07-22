<?php
/**
 * Server-side rendering of the `core/slider` block.
 *
 * @package WordPress
 */

/**
 * Returns SVG path data for slider navigation button icons.
 *
 * @param string $arrow_icon  Icon style.
 * @param bool   $is_previous Whether this is previous button.
 * @return string
 */
function block_core_slider_get_navigation_icon_path( $arrow_icon, $is_previous ) {
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
 * Renders the slider indicators.
 *
 * @param string $indicator_style Style of the indicators: 'dot' or 'line'.
 * @return string HTML string for the indicators.
 */
function block_core_slider_render_indicators_markup( $indicator_style ) {
	return '<div class="wp-block-slider-indicators__dots is-style-' . esc_attr( $indicator_style ) . '" role="group" aria-label="' . esc_attr__( 'Choose slide to display' ) . '" data-wp-interactive="core/slider"><template data-wp-each="state.indicators" data-wp-each-key="context.item"><button type="button" class="wp-block-slider-indicators__dot" data-wp-on--click="actions.goToSlide" data-wp-bind--aria-current="state.isIndicatorActive" data-wp-bind--aria-disabled="state.isIndicatorActive" data-wp-bind--aria-label="state.indicatorLabel"></button></template></div>';
}

/**
 * Renders a combined control bar when arrows and indicators share an in-flow
 * position: <prev> <indicators> <next>.
 *
 * @param string $arrow_icon             Icon style: 'chevron' or 'arrow'.
 * @param string $display_mode           Button content: 'icon', 'text', or 'both'.
 * @param string $indicator_style        Style of the indicators: 'dot' or 'line'.
 * @param string $position               Shared position: 'top' or 'bottom'.
 * @param bool   $show_indicators        Whether to render the indicators.
 * @param string $arrows_justification   Justification of the nav buttons: 'left', 'center', 'right', or 'space-between'.
 * @return string HTML string for the control bar.
 */
function block_core_slider_render_control_bar_markup( $arrow_icon, $display_mode, $indicator_style, $position, $show_indicators, $arrows_justification ) {
	$indicators_html = $show_indicators
		? block_core_slider_render_indicators_markup( $indicator_style )
		: '';

	$prev = block_core_slider_render_arrow_button_markup( $arrow_icon, $display_mode, true );
	$next = block_core_slider_render_arrow_button_markup( $arrow_icon, $display_mode, false );
	$content = $prev . $indicators_html . $next;

	return '<div class="wp-block-slider-control-bar is-position-' . esc_attr( $position ) . ' is-justify-' . esc_attr( $arrows_justification ) . '">' . $content . '</div>';
}

/**
 * Renders a single previous/next button.
 *
 * @param string $arrow_icon             Icon style: 'chevron' or 'arrow'.
 * @param string $display_mode           Button content: 'icon', 'text', or 'both'.
 * @param bool   $is_previous            True for the previous button, false for next.
 * @return string HTML string for the button.
 */
function block_core_slider_render_arrow_button_markup( $arrow_icon, $display_mode, $is_previous ) {
	$type        = $is_previous ? 'previous' : 'next';
	$button_text = $is_previous ? __( 'Previous' ) : __( 'Next' );
	$label       = $is_previous ? __( 'Previous slide' ) : __( 'Next slide' );

	$icon_svg  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" class="wp-block-slider-arrows-button__icon"><path d="' . esc_attr( block_core_slider_get_navigation_icon_path( $arrow_icon, $is_previous ) ) . '" /></svg>';
	$text_span = '<span class="wp-block-slider-arrows-button__text">' . esc_html( $button_text ) . '</span>';

	if ( 'icon' === $display_mode ) {
		$button_inner = $icon_svg;
	} elseif ( 'text' === $display_mode ) {
		$button_inner = $text_span;
	} elseif ( $is_previous ) {
		$button_inner = $icon_svg . $text_span;
	} else {
		$button_inner = $text_span . $icon_svg;
	}

	$button_classes = array(
		'wp-block-slider-arrows-button',
		'is-type-' . sanitize_html_class( $type ),
		'is-icon-' . sanitize_html_class( $arrow_icon ),
	);

	if ( 'text' !== $display_mode ) {
		$button_classes[] = 'has-icon';
	}

	if ( 'icon' !== $display_mode ) {
		$button_classes[] = 'has-text';
	}

	if ( 'both' === $display_mode && ! $is_previous ) {
		$button_classes[] = 'has-icon-right';
	}

	$btn_attrs = array(
		'class'                       => implode( ' ', $button_classes ),
		'type'                        => 'button',
		'data-wp-interactive'         => 'core/slider',
		'data-wp-on--click'           => $is_previous ? 'actions.prevSlide' : 'actions.nextSlide',
		'data-wp-bind--aria-disabled' => $is_previous ? 'state.isAtStart' : 'state.isAtEnd',
	);

	if ( 'icon' === $display_mode ) {
		$btn_attrs['aria-label'] = $label;
	}

	return '<button' . block_core_slider_build_attrs( $btn_attrs ) . '>' . $button_inner . '</button>';
}

/**
 * Renders the previous/next buttons over the slider.
 *
 * @param string $arrow_icon   Icon style: 'chevron' or 'arrow'.
 * @param string $display_mode Button content: 'icon', 'text', or 'both'.
 * @return string HTML string for the overlay arrows.
 */
function block_core_slider_render_overlay_arrows_markup( $arrow_icon, $display_mode ) {
	$button_html  = block_core_slider_render_arrow_button_markup( $arrow_icon, $display_mode, true );
	$button_html .= block_core_slider_render_arrow_button_markup( $arrow_icon, $display_mode, false );

	return '<div class="wp-block-slider-arrows is-position-overlay">' . $button_html . '</div>';
}

/**
 * Renders the `core/slider` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block content.
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
	}

	$arrow_icon             = $attributes['arrowIcon'] ?? 'chevron';
	$indicator_style        = $attributes['indicatorStyle'] ?? 'dot';
	$display_mode           = $attributes['displayMode'] ?? 'icon';
	$arrows_position        = $attributes['navigationPosition'] ?? 'overlay';
	$arrows_justification   = $attributes['navigationJustification'] ?? 'space-between';
	$show_indicators        = isset( $attributes['showIndicators'] ) ? (bool) $attributes['showIndicators'] : true;

	$slides_html = $p->get_updated_html();

	$overlay_indicators = '';
	if ( 'overlay' === $arrows_position && $show_indicators ) {
		$overlay_indicators = '<div class="wp-block-slider-indicators is-position-overlay">' . block_core_slider_render_indicators_markup( $indicator_style ) . '</div>';
	}

	$track_markup = sprintf(
		'<div class="wp-block-slider-track" data-wp-on--scroll="actions.handleScroll" data-wp-init="callbacks.initTrack" tabindex="0" aria-label="%1$s">%2$s</div>',
		esc_attr__( 'Slides' ),
		$slides_html
	);

	if ( 'overlay' === $arrows_position ) {
		$arrows_markup    = block_core_slider_render_overlay_arrows_markup( $arrow_icon, $display_mode );
		$rendered_content = $track_markup . $arrows_markup . $overlay_indicators;
	} else {
		$control_bar = block_core_slider_render_control_bar_markup(
			$arrow_icon,
			$display_mode,
			$indicator_style,
			$arrows_position,
			$show_indicators,
			$arrows_justification
		);
		$rendered_content = ( 'top' === $arrows_position )
			? $control_bar . $track_markup
			: $track_markup . $control_bar;
	}

	$rendered_content .= $other_content;

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
			/* translators: 1: Target slide number, 2: Total number of slides. */
			'indicatorLabelTemplate' => __( 'Go to slide %1$d of %2$d' ),
			/* translators: 1: Current slide number, 2: Total number of slides. */
			'slideLabelTemplate'     => __( 'Slide %1$d of %2$d' ),
			/* translators: 1: First visible slide number, 2: Last visible slide number, 3: Total number of slides. */
			'slidesLabelTemplate'    => __( 'Slides %1$d–%2$d of %3$d' ),
		)
	);

	$aria_label = ! empty( $attributes['ariaLabel'] ) ? $attributes['ariaLabel'] : __( 'Slider' );

	$wrapper_style = "--wp--slider-slides-to-show: {$slides_to_show};";

	if ( isset( $attributes['navigationColor'] ) ) {
		$navigation_color = $attributes['navigationColor'];
		$wrapper_style   .= " --wp--slider-navigation-color: {$navigation_color};";
	}

	if ( isset( $attributes['navigationBackgroundColor'] ) ) {
		$navigation_background_color = $attributes['navigationBackgroundColor'];
		$wrapper_style              .= sprintf(
			' --wp--slider-navigation-background-color: %s;',
			$navigation_background_color
		);
	}

	$wrapper_style = safecss_filter_attr( $wrapper_style );

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class'                => 'is-arrows-position-' . sanitize_html_class( $arrows_position ),
			'data-wp-interactive'  => 'core/slider',
			'data-wp-context'      => wp_json_encode( $context ),
			'data-wp-on--focusin'  => 'actions.handleFocusIn',
			'data-wp-on--focusout' => 'actions.handleFocusOut',
			'style'                => $wrapper_style,
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
