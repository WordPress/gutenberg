<?php
/**
 * Spacing block support flag.
 *
 * For backwards compatibility with core, this remains separate to the
 * dimensions.php block support despite both belonging under a single panel in
 * the editor.
 *
 * @package gutenberg
 */

/**
 * Registers the style block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_spacing_support( $block_type ) {
	$has_spacing_support = gutenberg_block_has_support( $block_type, array( 'spacing' ), false );

	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_spacing_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Add CSS classes for block spacing to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param WP_Block_Type $block_type       Block Type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Block spacing CSS classes and inline styles.
 */
function gutenberg_apply_spacing_support( $block_type, $block_attributes ) {
	if ( gutenberg_skip_spacing_serialization( $block_type ) ) {
		return array();
	}

	$has_padding_support = gutenberg_block_has_support( $block_type, array( 'spacing', 'padding' ), false );
	$has_margin_support  = gutenberg_block_has_support( $block_type, array( 'spacing', 'margin' ), false );
	$has_gap_support     = gutenberg_block_has_support( $block_type, array( 'spacing', 'blockGap' ), false );
	$styles              = array();

	if ( $has_padding_support ) {
		$padding_value = _wp_array_get( $block_attributes, array( 'style', 'spacing', 'padding' ), null );

		if ( is_array( $padding_value ) ) {
			foreach ( $padding_value as $key => $value ) {
				$styles[] = sprintf( 'padding-%s: %s;', $key, $value );
			}
		} elseif ( null !== $padding_value ) {
			$styles[] = sprintf( 'padding: %s;', $padding_value );
		}
	}

	if ( $has_margin_support ) {
		$margin_value = _wp_array_get( $block_attributes, array( 'style', 'spacing', 'margin' ), null );

		if ( is_array( $margin_value ) ) {
			foreach ( $margin_value as $key => $value ) {
				$styles[] = sprintf( 'margin-%s: %s;', $key, $value );
			}
		} elseif ( null !== $margin_value ) {
			$styles[] = sprintf( 'margin: %s;', $margin_value );
		}
	}

	if ( $has_gap_support ) {
		$gap_value = _wp_array_get( $block_attributes, array( 'style', 'spacing', 'blockGap' ), null );

		if ( is_string( $gap_value ) ) {
			$styles[] = sprintf( '--wp--style--block-gap: %s', $gap_value );
		}
	}

	return empty( $styles ) ? array() : array( 'style' => implode( ' ', $styles ) );
}

/**
 * Checks whether serialization of the current block's spacing properties should
 * occur.
 *
 * @param WP_Block_type $block_type Block type.
 *
 * @return boolean Whether to serialize spacing support styles & classes.
 */
function gutenberg_skip_spacing_serialization( $block_type ) {
	$spacing_support = _wp_array_get( $block_type->supports, array( 'spacing' ), false );

	return is_array( $spacing_support ) &&
		array_key_exists( '__experimentalSkipSerialization', $spacing_support ) &&
		$spacing_support['__experimentalSkipSerialization'];
}


/**
 * Renders the spacing support to the block wrapper, for supports that
 * require block-level server-side rendering, for example blockGap support
 * which uses CSS variables.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_spacing_support( $block_content, $block ) {
	$block_type      = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$has_gap_support = gutenberg_block_has_support( $block_type, array( 'spacing', 'blockGap' ), false );
	if ( ! $has_gap_support || ! isset( $block['attrs']['style']['spacing']['blockGap'] ) ) {
		return $block_content;
	}

	$id    = uniqid();
	$style = sprintf(
		'.wp-container-%s { --wp--style--block-gap: %s; }',
		$id,
		esc_attr( $block['attrs']['style']['spacing']['blockGap'] )
	);

	// This assumes the hook only applies to blocks with a single wrapper.
	$content = preg_replace(
		'/' . preg_quote( 'class="', '/' ) . '/',
		'class="wp-container-' . $id . ' ',
		$block_content,
		1
	);

	// Ideally styles should be loaded in the head, but blocks may be parsed
	// after that, so loading in the footer for now.
	// See https://core.trac.wordpress.org/ticket/53494.
	add_action(
		'wp_footer',
		function () use ( $style ) {
			echo '<style>' . $style . '</style>';
		}
	);

	return $content;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'spacing',
	array(
		'register_attribute' => 'gutenberg_register_spacing_support',
		'apply'              => 'gutenberg_apply_spacing_support',
	)
);

add_filter( 'render_block', 'gutenberg_render_spacing_support', 10, 2 );
