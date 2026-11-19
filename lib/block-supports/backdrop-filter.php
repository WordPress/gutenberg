<?php
/**
 * Backdrop-filter block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style and backdrop-filter block attributes for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_backdrop_filter_support( $block_type ) {
	$has_backdrop_filter_support = block_has_support( $block_type, array( 'backdropFilter' ), false );

	if ( ! $has_backdrop_filter_support ) {
		return;
	}

	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Add CSS classes and inline styles for backdrop-filter features to the incoming attributes array.
 * This is applied to the block markup on the front-end. Emits both the standard
 * `backdrop-filter` property and `-webkit-backdrop-filter` for Safari <= 17.3
 * compatibility.
 *
 * @param  WP_Block_Type $block_type       Block type.
 * @param  array         $block_attributes Block attributes.
 *
 * @return array Backdrop-filter inline styles.
 */
function gutenberg_apply_backdrop_filter_support( $block_type, $block_attributes ) {
	$has_backdrop_filter_support = block_has_support( $block_type, array( 'backdropFilter' ), false );

	if (
		! $has_backdrop_filter_support ||
		wp_should_skip_block_supports_serialization( $block_type, 'backdropFilter' )
	) {
		return array();
	}

	$backdrop_filter_value = $block_attributes['style']['backdropFilter'] ?? null;

	if ( null === $backdrop_filter_value || '' === $backdrop_filter_value ) {
		return array();
	}

	$block_styles = array(
		'backdropFilter' => $backdrop_filter_value,
	);

	$styles = gutenberg_style_engine_get_styles( $block_styles );

	if ( empty( $styles['css'] ) ) {
		return array();
	}

	// The style engine emits `backdrop-filter:<value>;`. We duplicate the value
	// with the `-webkit-` prefix so older Safari keeps working.
	// See https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
	$webkit_css = str_replace(
		'backdrop-filter:',
		'-webkit-backdrop-filter:',
		$styles['css']
	);

	return array( 'style' => $webkit_css . $styles['css'] );
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'backdrop-filter',
	array(
		'register_attribute' => 'gutenberg_register_backdrop_filter_support',
		'apply'              => 'gutenberg_apply_backdrop_filter_support',
	)
);

// Add backdrop-filter and -webkit-backdrop-filter to the safe CSS property allowlist.
add_filter(
	'safe_style_css',
	function ( $styles ) {
		$styles[] = 'backdrop-filter';
		$styles[] = '-webkit-backdrop-filter';
		return $styles;
	}
);
