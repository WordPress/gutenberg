<?php
/**
 * Elements styles block support.
 *
 * @package gutenberg
 */

/**
 * Get the elements class names.
 *
 * @param array $block Block object.
 * @return string      The unique class name.
 */
function gutenberg_get_elements_class_name( $block ) {
	return 'wp-elements-' . md5( serialize( $block ) );
}

/**
 * Update the block content with elements class names.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_elements_support( $block_content, $block ) {
	if ( ! $block_content || empty( $block['attrs'] ) ) {
		return $block_content;
	}

	$block_type                            = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$skip_link_color_serialization         = wp_should_skip_block_supports_serialization( $block_type, 'color', 'link' );
	$skip_heading_color_serialization      = wp_should_skip_block_supports_serialization( $block_type, 'color', 'heading' );
	$skip_button_color_serialization       = wp_should_skip_block_supports_serialization( $block_type, 'color', 'button' );
	$skips_all_element_color_serialization = $skip_link_color_serialization &&
		$skip_heading_color_serialization &&
		$skip_button_color_serialization;

	if ( $skips_all_element_color_serialization ) {
		return $block_content;
	}

	$element_colors_set = 0;

	$link_color_paths = array(
		'style.elements.link.color.text',
		'style.elements.link.:hover.color.text',
	);

	foreach ( $link_color_paths as $element_color_path ) {
		$element_color = _wp_array_get( $block['attrs'], explode( '.', $element_color_path, ), null );

		if ( null !== $element_color && ! $skip_link_color_serialization ) {
			$element_colors_set++;
		}
	}

	$heading_color_paths = array(
		'style.elements.heading.color.text',
		'style.elements.heading.color.background',
		'style.elements.heading.color.gradient',
		'style.elements.h1.color.text',
		'style.elements.h1.color.background',
		'style.elements.h1.color.gradient',
		'style.elements.h2.color.text',
		'style.elements.h2.color.background',
		'style.elements.h2.color.gradient',
		'style.elements.h3.color.text',
		'style.elements.h3.color.background',
		'style.elements.h3.color.gradient',
		'style.elements.h4.color.text',
		'style.elements.h4.color.background',
		'style.elements.h4.color.gradient',
		'style.elements.h5.color.text',
		'style.elements.h5.color.background',
		'style.elements.h5.color.gradient',
		'style.elements.h6.color.text',
		'style.elements.h6.color.background',
		'style.elements.h6.color.gradient',
	);

	foreach ( $heading_color_paths as $element_color_path ) {
		$element_color = _wp_array_get( $block['attrs'], explode( '.', $element_color_path, ), null );

		if ( null !== $element_color && ! $skip_heading_color_serialization ) {
			$element_colors_set++;
		}
	}

	$button_color_paths = array(
		'style.elements.button.color.text',
		'style.elements.button.color.background',
		'style.elements.button.color.gradient',
	);

	foreach ( $button_color_paths as $element_color_path ) {
		$element_color = _wp_array_get( $block['attrs'], explode( '.', $element_color_path, ), null );

		if ( null !== $element_color && ! $skip_button_color_serialization ) {
			$element_colors_set++;
		}
	}

	if ( ! $element_colors_set ) {
		return $block_content;
	}

	// Like the layout hook this assumes the hook only applies to blocks with a single wrapper.
	// Add the class name to the first element, presuming it's the wrapper, if it exists.
	$tags = new WP_HTML_Tag_Processor( $block_content );
	if ( $tags->next_tag() ) {
		$tags->add_class( gutenberg_get_elements_class_name( $block ) );
	}

	return $tags->get_updated_html();
}

/**
 * Render the elements stylesheet.
 *
 * In the case of nested blocks we want the parent element styles to be rendered before their descendants.
 * This solves the issue of an element (e.g.: link color) being styled in both the parent and a descendant:
 * we want the descendant style to take priority, and this is done by loading it after, in DOM order.
 *
 * @param string|null $pre_render   The pre-rendered content. Default null.
 * @param array       $block The block being rendered.
 *
 * @return null
 */
function gutenberg_render_elements_support_styles( $pre_render, $block ) {
	$block_type           = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$element_block_styles = isset( $block['attrs']['style']['elements'] ) ? $block['attrs']['style']['elements'] : null;

	if ( ! $element_block_styles ) {
		return null;
	}

	$skip_link_color_serialization         = wp_should_skip_block_supports_serialization( $block_type, 'color', 'link' );
	$skip_heading_color_serialization      = wp_should_skip_block_supports_serialization( $block_type, 'color', 'heading' );
	$skip_button_color_serialization       = wp_should_skip_block_supports_serialization( $block_type, 'color', 'button' );
	$skips_all_element_color_serialization = $skip_link_color_serialization &&
		$skip_heading_color_serialization &&
		$skip_button_color_serialization;

	if ( $skips_all_element_color_serialization ) {
		return null;
	}

	$class_name = gutenberg_get_elements_class_name( $block );

	// Link colors
	$link_block_styles = isset( $element_block_styles['link'] ) ? $element_block_styles['link'] : null;

	if ( ! $skip_link_color_serialization && $link_block_styles ) {
		gutenberg_style_engine_get_styles(
			$link_block_styles,
			array(
				'selector' => ".$class_name a",
				'context'  => 'block-supports',
			)
		);

		if ( isset( $link_block_styles[':hover'] ) ) {
			gutenberg_style_engine_get_styles(
				$link_block_styles[':hover'],
				array(
					'selector' => ".$class_name a:hover",
					'context'  => 'block-supports',
				)
			);
		}
	}

	// Heading colors
	if ( ! $skip_heading_color_serialization ) {
		$heading_levels = array( 'heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' );

		foreach ( $heading_levels as $heading_level ) {
			$heading_block_styles = isset( $element_block_styles[ $heading_level ] ) ? $element_block_styles[ $heading_level ] : null;
			$heading_selector = 'heading' !== $heading_level
				? ".$class_name $heading_level"
				: ".$class_name h1, .$class_name h2, .$class_name h3, .$class_name h4, .$class_name h5, .$class_name h6";

			if ( $heading_block_styles ) {
				gutenberg_style_engine_get_styles(
					$heading_block_styles,
					array(
						'selector' => $heading_selector,
						'context'  => 'block-supports',
					)
				);
			}
		}
	}

	// Button colors
	$button_block_styles = isset( $element_block_styles['button'] ) ? $element_block_styles['button'] : null;

	if ( ! $skip_button_color_serialization && $button_block_styles ) {
		gutenberg_style_engine_get_styles(
			$button_block_styles,
			array(
				'selector' => ".$class_name .wp-element-button, .$class_name .wp-block-button__link",
				'context'  => 'block-supports',
			)
		);
	}

	return null;
}

// Remove WordPress core filters to avoid rendering duplicate elements stylesheet & attaching classes twice.
remove_filter( 'render_block', 'wp_render_elements_support', 10, 2 );
remove_filter( 'pre_render_block', 'wp_render_elements_support_styles', 10, 2 );
add_filter( 'render_block', 'gutenberg_render_elements_support', 10, 2 );
add_filter( 'pre_render_block', 'gutenberg_render_elements_support_styles', 10, 2 );
