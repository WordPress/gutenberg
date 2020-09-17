<?php
/**
 * Align block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the custom css block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_custom_css_support( $block_type ) {
	$has_custom_css_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_custom_css_support = gutenberg_experimental_get( $block_type->supports, array( 'customCSS' ), false );
	}
	if ( $has_custom_css_support ) {
		if ( ! $block_type->attributes ) {
			$block_type->attributes = array();
		}

		if ( ! array_key_exists( 'css', $block_type->attributes ) ) {
			$block_type->attributes['css'] = array(
				'type' => 'string',
			);
		}
	}
}

/**
 * Add generated CSS class and the stylesheet.
 *
 * @param array         $attributes       Comprehensive list of attributes to be applied.
 * @param array         $block_attributes Block attributes.
 * @param WP_Block_Type $block_type       Block Type.
 *
 * @return array Block custom CSS classes.
 */
function gutenberg_apply_custom_css_support( $attributes, $block_attributes, $block_type ) {
	$has_custom_css_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_custom_css_support = gutenberg_experimental_get( $block_type->supports, array( 'customCSS' ), false );
    }
	if ( $has_custom_css_support && isset( $block_attributes['css'] ) && ! empty(  $block_attributes[ 'css' ] ) ) {
        $generated_class_name = uniqid( 'wp-block-css-' );
        wp_add_inline_style( 
            'wp-block-custom-css', 
            str_replace( ':self', '.' . $generated_class_name, $block_attributes[ 'css' ] )
        );
        $attributes['css_classes'][] = $generated_class_name;
	}

	return $attributes;
}

/**
 * This style is used to enqueue the dynamic block custom CSS styles.
 */
function gutenberg_register_custom_css_style() {
    wp_register_style('wp-block-custom-css', false);
}

add_action( 'init', 'gutenberg_register_custom_css_style' );

/**
 * Enqueue an empty style to the footer.
 */
function gutenberg_enqueue_custom_css_style() {
    wp_enqueue_style( 'wp-block-custom-css' );
}
add_action( 'get_footer', 'gutenberg_enqueue_custom_css_style' );
