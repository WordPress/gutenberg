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
 * @param bool   $show_indicators        Whether to render the indicator dots.
 * @param string $arrows_justification   Justification of the nav buttons: 'left', 'center', 'right', or 'space-between'.
 * @return string HTML string for the control bar.
 */
function block_core_slider_render_control_bar_markup( $arrow_icon, $navigation_button_type, $indicator_style, $position, $show_indicators, $arrows_justification ) {
	$indicators_html = $show_indicators
		? '<div class="wp-block-slider-indicators__dots is-style-' . esc_attr( $indicator_style ) . '" data-wp-interactive="core/slider"><template data-wp-each="state.dots" data-wp-each-key="context.item"><button type="button" class="wp-block-slider-indicators__dot" data-wp-on--click="actions.goToSlide" data-wp-bind--aria-current="state.isDotActive" data-wp-bind--aria-label="state.dotLabel"></button></template></div>'
		: '';

	$prev = block_core_slider_render_arrow_button_markup( $arrow_icon, $navigation_button_type, true );
	$next = block_core_slider_render_arrow_button_markup( $arrow_icon, $navigation_button_type, false );
	$content = $prev . $indicators_html . $next;

	return '<div class="wp-block-slider-control-bar is-position-' . esc_attr( $position ) . ' is-justify-' . esc_attr( $arrows_justification ) . '">' . $content . '</div>';
}

/**
 * Renders a single previous/next button.
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

	$button_classes = array(
		'wp-block-slider-arrows-button',
		'is-type-' . sanitize_html_class( $type ),
		'is-icon-' . sanitize_html_class( $arrow_icon ),
	);

	if ( 'text' !== $navigation_button_type ) {
		$button_classes[] = 'has-icon';
	}

	if ( 'icon' !== $navigation_button_type ) {
		$button_classes[] = 'has-text';
	}

	if ( 'both' === $navigation_button_type && ! $is_previous ) {
		$button_classes[] = 'has-icon-right';
	}

	$btn_attrs = array(
		'class'                       => implode( ' ', $button_classes ),
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
 * Renders a container and the previous/next buttons for the slider.
 *
 * @param string $arrow_icon             Icon style: 'chevron' or 'arrow'.
 * @param string $navigation_button_type Button content: 'icon', 'text', or 'both'.
 * @param string $arrows_position        Where arrows are placed.
 * @param string $arrows_justification   Justification of the nav buttons: 'left', 'center', 'right', or 'space-between'. Ignored for overlay.
 * @return string HTML string for the arrows container, or empty string when hidden.
 */
function block_core_slider_render_arrows_markup( $arrow_icon, $navigation_button_type, $arrows_position, $arrows_justification ) {
	$button_html  = block_core_slider_render_arrow_button_markup( $arrow_icon, $navigation_button_type, true );
	$button_html .= block_core_slider_render_arrow_button_markup( $arrow_icon, $navigation_button_type, false );

	$class = 'wp-block-slider-arrows is-position-' . esc_attr( $arrows_position );
	if ( 'overlay' !== $arrows_position ) {
		$class .= ' is-justify-' . esc_attr( $arrows_justification );
	}

	return '<div class="' . $class . '">' . $button_html . '</div>';
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

	$arrow_icon             = $attributes['arrowIcon'] ?? 'chevron';
	$indicator_style        = $attributes['indicatorStyle'] ?? 'dot';
	$navigation_button_type = $attributes['navigationButtonType'] ?? 'icon';
	$arrows_position        = $attributes['navigationPosition'] ?? 'overlay';
	$arrows_justification   = $attributes['navigationJustification'] ?? 'space-between';
	$show_indicators        = isset( $attributes['showIndicators'] ) ? (bool) $attributes['showIndicators'] : true;

	$slides_html = $p->get_updated_html();

	$overlay_indicator = '';
	if ( 'overlay' === $arrows_position && $show_indicators ) {
		$dots_html         = '<div class="wp-block-slider-indicators__dots is-style-' . esc_attr( $indicator_style ) . '" data-wp-interactive="core/slider"><template data-wp-each="state.dots" data-wp-each-key="context.item"><button type="button" class="wp-block-slider-indicators__dot" data-wp-on--click="actions.goToSlide" data-wp-bind--aria-current="state.isDotActive" data-wp-bind--aria-label="state.dotLabel"></button></template></div>';
		$overlay_indicator = '<div class="wp-block-slider-indicators is-position-overlay">' . $dots_html . '</div>';
	}

	$track_markup = sprintf(
		'<div class="wp-block-slider-track" data-wp-on--scroll="actions.handleScroll" data-wp-init="callbacks.initTrack" tabindex="0" aria-label="%1$s">%2$s</div>',
		esc_attr__( 'Slides' ),
		$slides_html
	);

	if ( 'overlay' === $arrows_position ) {
		$arrows_markup    = block_core_slider_render_arrows_markup( $arrow_icon, $navigation_button_type, $arrows_position, $arrows_justification );
		$rendered_content = $track_markup . $arrows_markup . $overlay_indicator . $other_content;
	} else {
		$control_bar = block_core_slider_render_control_bar_markup(
			$arrow_icon,
			$navigation_button_type,
			$indicator_style,
			$arrows_position,
			$show_indicators,
			$arrows_justification
		);
		$rendered_content = ( 'top' === $arrows_position )
			? $control_bar . $track_markup . $other_content
			: $track_markup . $control_bar . $other_content;
	}

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
			'class'                => 'is-arrows-position-' . sanitize_html_class( $arrows_position ),
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
