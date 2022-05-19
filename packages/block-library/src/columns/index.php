<?php

/**
 * Adds a style tag for the --wp--style--unstable-columns-gap var.
 *
 * The Columns block requires the block's spacing blockGap value in order to calculate the 2 column offset in tablet viewport.
 *
 * @param array  $attributes Attributes of the block being rendered.
 * @param string $content Content of the block being rendered.
 * @return string The content of the block being rendered.
 */
function block_core_columns_render( $attributes, $content ) {
	$gap_value = _wp_array_get( $attributes, array( 'style', 'spacing', 'blockGap' ), null );

	if ( ! $gap_value ) {
		return $content;
	}

	// Skip if gap value contains unsupported characters.
	// Regex for CSS value borrowed from `safecss_filter_attr`, and used here
	// because we only want to match against the value, not the CSS attribute.
	if ( is_array( $gap_value ) ) {
		foreach ( $gap_value as $key => $value ) {
			$gap_value[ $key ] = $value && preg_match( '%[\\\(&=}]|/\*%', $value ) ? null : $value;
		}
	} else {
		$gap_value = preg_match( '%[\\\(&=}]|/\*%', $gap_value ) ? null : $gap_value;
	}

	// The gap value can be a string value or a split top/left value. For the columns we want `left` which equates to gap-column.
	// See: https://github.com/WordPress/gutenberg/pull/37736.
	if ( is_array( $gap_value ) ) {
		$gap_value = isset( $gap_value['left'] ) ? $gap_value['left'] : null;
	}

	if ( ! $gap_value ) {
		return $content;
	}

	$class   = wp_unique_id( 'wp-block-columns-' );
	$content = preg_replace(
		'/' . preg_quote( 'class="', '/' ) . '/',
		'class="' . $class . ' ',
		$content,
		1
	);

	$style = '.' . $class . '{ --wp--style--unstable-columns-gap: ' . $gap_value . ';}';
	// Ideally styles should be loaded in the head, but blocks may be parsed
	// after that, so loading in the footer for now.
	// See https://core.trac.wordpress.org/ticket/53494.
	add_action(
		'wp_footer',
		function () use ( $style ) {
			echo '<style> ' . $style . '</style>';
		}
	);
	return $content;
}

/**
 * Registers the `core/columns` block on server.
 */
function register_block_core_columns() {
	register_block_type_from_metadata(
		__DIR__ . '/columns',
		array(
			'render_callback' => 'block_core_columns_render',
		)
	);
}

add_action( 'init', 'register_block_core_columns' );
