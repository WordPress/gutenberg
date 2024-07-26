<?php
/**
 * Background block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_background_support( $block_type ) {
	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	// Check for existing style attribute definition e.g. from block.json.
	if ( array_key_exists( 'style', $block_type->attributes ) ) {
		return;
	}

	$has_background_support = block_has_support( $block_type, array( 'background' ), false );

	if ( $has_background_support ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Renders the background styles to the block wrapper.
 * This block support uses the `render_block` hook to ensure that
 * it is also applied to non-server-rendered blocks.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_background_support( $block_content, $block ) {
	$block_type                      = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$block_attributes                = ( isset( $block['attrs'] ) && is_array( $block['attrs'] ) ) ? $block['attrs'] : array();
	$has_background_image_support    = block_has_support( $block_type, array( 'background', 'backgroundImage' ), false );
	$has_background_gradient_support = block_has_support( $block_type, array( 'color', 'gradients' ), false );
	$global_styles                   = gutenberg_get_global_styles();
	$global_block_styles             = $global_styles['blocks'][ $block['blockName'] ] ?? null;

	// Background styles.
	$background_styles = array();
	if ( $has_background_image_support &&
		! wp_should_skip_block_supports_serialization( $block_type, 'background', 'backgroundImage' ) &&
		! empty( $block_attributes['style']['background'] )
	) {
		$background_styles['backgroundImage']      = $block_attributes['style']['background']['backgroundImage'] ?? null;
		$background_styles['backgroundSize']       = $block_attributes['style']['background']['backgroundSize'] ?? null;
		$background_styles['backgroundPosition']   = $block_attributes['style']['background']['backgroundPosition'] ?? null;
		$background_styles['backgroundRepeat']     = $block_attributes['style']['background']['backgroundRepeat'] ?? null;
		$background_styles['backgroundAttachment'] = $block_attributes['style']['background']['backgroundAttachment'] ?? null;

		if ( ! empty( $background_styles['backgroundImage'] ) ) {
			$background_styles['backgroundSize'] = $background_styles['backgroundSize'] ?? 'cover';
			// If the background size is set to `contain` and no position is set, set the position to `center`.
			if ( 'contain' === $background_styles['backgroundSize'] && ! $background_styles['backgroundPosition'] ) {
				$background_styles['backgroundPosition'] = 'center';
			}
		}
	}

	// Gradient styles.
	$background_gradient_styles = array();
	if ( $has_background_gradient_support && ! wp_should_skip_block_supports_serialization( $block_type, 'color', 'gradients' ) ) {
		$preset_gradient_color                  = array_key_exists( 'gradient', $block_attributes ) ? "var:preset|gradient|{$block_attributes['gradient']}" : null;
		$custom_gradient_color                  = $block_attributes['style']['color']['gradient'] ?? null;
		$background_gradient_styles['gradient'] = $preset_gradient_color ? $preset_gradient_color : $custom_gradient_color;
	}

	// @TODO: This is a temporary solution to handle the inheritance of background image and gradient.
	// This should be handled in the style engine.??
	// if inherited gradient and style background image, remove the gradient class, merge the gradient style with the style attribute
	// if inherited background image and style gradient.
	if ( ! isset( $background_styles['backgroundImage'] ) && ! empty( $global_block_styles['background']['backgroundImage'] ) && isset( $background_gradient_styles['gradient'] ) ) {
		$background_styles['backgroundImage'] = $global_block_styles['background']['backgroundImage'];
	}

	if ( ! isset( $background_gradient_styles['gradient'] ) && ! empty( $global_block_styles['color']['gradient'] ) && isset( $background_styles['backgroundImage'] ) ) {
		$background_gradient_styles['gradient'] = $global_block_styles['color']['gradient'];
	}

	if (
		empty( $background_styles ) &&
		empty( $background_gradient_styles )
	) {
		return $block_content;
	}

	$styles = gutenberg_style_engine_get_styles(
		array(
			'background' => $background_styles,
			'color'      => $background_gradient_styles,
		),
		array( 'convert_vars_to_classnames' => ! empty( $preset_gradient_color ) && empty( $background_styles ) )
	);

	if ( ! empty( $styles['css'] ) || $preset_gradient_color ) {
		// Inject background styles to the first element, presuming it's the wrapper, if it exists.
		$tags = new WP_HTML_Tag_Processor( $block_content );

		if ( $tags->next_tag() ) {
			$existing_style = $tags->get_attribute( 'style' );

			// Remove any existing background color if a background image and gradient is set.
			if ( $existing_style && ! empty( $background_gradient_styles['gradient'] ) && ! empty( $background_styles ) ) {
				$existing_style = preg_replace( '/background\s*:\s*' . preg_quote( $background_gradient_styles['gradient'], '/' ) . '\s*;?/', '', $existing_style, 1 );
			}

			if ( ! empty( $styles['css'] ) ) {
				$updated_style = '';

				if ( ! empty( $existing_style ) ) {
					$updated_style = $existing_style;
					if ( ! str_ends_with( $existing_style, ';' ) ) {
						$updated_style .= ';';
					}
				}

				$updated_style .= $styles['css'];

				$tags->set_attribute( 'style', $updated_style );
				// $tags->add_class( 'has-background' );
			}
		}

		// This is just testing. The style engine should be smart enough to remove the classname for a preset, where
		// it's used in the CSS string.
		// And this is done in the site editor when editing the block.
		if ( ! empty( $styles['classnames'] ) && $preset_gradient_color ) {
			foreach ( explode( ' ', $styles['classnames'] ) as $class_name ) {
				if ( 'has-background' !== $class_name ) {
					$tags->remove_class( $class_name );
				}
			}
		}

		return $tags->get_updated_html();
	}

	return $block_content;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'background',
	array(
		'register_attribute' => 'gutenberg_register_background_support',
	)
);

if ( function_exists( 'wp_render_background_support' ) ) {
	remove_filter( 'render_block', 'wp_render_background_support' );
}
add_filter( 'render_block', 'gutenberg_render_background_support', 10, 2 );
