<?php
/**
 * Server-side rendering of the `core/table-of-contents` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/table-of-contents` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @return string Returns the table of contents markup.
 */
function render_block_core_table_of_contents( $attributes ) {
	$headings = isset( $attributes['headings'] ) ? $attributes['headings'] : array();

	if ( empty( $headings ) ) {
		return '';
	}

	// Get the aria-label from block attributes, or fallback to localized default.
	$aria_label = '';
	if ( isset( $attributes['ariaLabel'] ) && ! empty( $attributes['ariaLabel'] ) ) {
		$aria_label = $attributes['ariaLabel'];
	} else {
		$aria_label = __( 'Table of Contents', 'gutenberg' );
	}

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'aria-label' => $aria_label,
		)
	);

	$nested_headings = block_core_table_of_contents_convert_linear_to_nested_headings( $headings );
	$list_items      = block_core_table_of_contents_build_nested_list_items( $nested_headings );

	$html = sprintf(
		'<nav %s><ol>%s</ol></nav>',
		$wrapper_attributes,
		$list_items
	);

	$processor = new WP_HTML_Tag_Processor( $html );
	if ( $processor->next_tag( 'nav' ) ) {
		$processor->set_attribute( 'aria-label', $aria_label );
	}

	return $processor->get_updated_html();
}

/**
 * Converts linear heading list to nested structure.
 *
 * @param array $headings Linear array of headings.
 * @return array Nested array of headings.
 */
function block_core_table_of_contents_convert_linear_to_nested_headings( $headings ) {
	$nested_heading_list = array();

	foreach ( $headings as $key => $heading ) {
		if ( empty( $heading['content'] ) ) {
			continue;
		}

		if ( $heading['level'] === $headings[0]['level'] ) {
			if ( isset( $headings[ $key + 1 ] ) && $headings[ $key + 1 ]['level'] > $heading['level'] ) {
				$end_of_slice = count( $headings );
				for ( $i = $key + 1; $i < count( $headings ); $i++ ) {
					if ( $headings[ $i ]['level'] === $heading['level'] ) {
						$end_of_slice = $i;
						break;
					}
				}

				$nested_heading_list[] = array(
					'heading'  => $heading,
					'children' => block_core_table_of_contents_convert_linear_to_nested_headings(
						array_slice( $headings, $key + 1, $end_of_slice - $key - 1 )
					),
				);
			} else {
				$nested_heading_list[] = array(
					'heading'  => $heading,
					'children' => array(),
				);
			}
		}
	}

	return $nested_heading_list;
}

/**
 * Builds nested list items HTML recursively.
 *
 * @param array $nested_headings Nested array of headings.
 * @return string HTML for nested list items.
 */
function block_core_table_of_contents_build_nested_list_items( $nested_headings ) {
	$html = '';

	foreach ( $nested_headings as $item ) {
		$heading = $item['heading'];
		$link    = ! empty( $heading['link'] ) ? $heading['link'] : '';

		$html .= '<li>';
		$html .= sprintf(
			'<a class="wp-block-table-of-contents__entry" href="%s">%s</a>',
			esc_url( $link ),
			esc_html( $heading['content'] )
		);

		if ( ! empty( $item['children'] ) ) {
			$html .= '<ol>' . block_core_table_of_contents_build_nested_list_items( $item['children'] ) . '</ol>';
		}

		$html .= '</li>';
	}

	return $html;
}

/**
 * Registers the `core/table-of-contents` block on the server.
 */
function register_block_core_table_of_contents() {
	register_block_type_from_metadata(
		__DIR__ . '/table-of-contents',
		array(
			'render_callback' => 'render_block_core_table_of_contents',
		)
	);
}
add_action( 'init', 'register_block_core_table_of_contents' );
