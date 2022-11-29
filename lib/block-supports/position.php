<?php
/**
 * Position block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_position_support( $block_type ) {
	$has_position_support = block_has_support( $block_type, array( 'position' ), false );

	// Set up attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_position_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Generates the CSS for position support from the style object.
 *
 * @param string $selector CSS selector.
 * @param array  $style    Style object.
 * @return string CSS styles on success. Else, empty string.
 */
function gutenberg_get_position_style( $selector, $style ) {
	$position_styles = array();
	$position_type   = _wp_array_get( $style, array( 'position' ), '' );

	if (
		in_array( $position_type, array( 'fixed', 'sticky' ), true )
	) {
		$sides = array( 'top', 'right', 'bottom', 'left' );

		foreach ( $sides as $side ) {
			$side_value = _wp_array_get( $style, array( 'position', $side ) );
			if ( null !== $side_value ) {
				/*
				* For fixed or sticky top positions,
				* ensure the value includes an offset for the logged in admin bar.
				*/
				if (
					'top' === $side &&
					( 'fixed' === $position_type || 'sticky' === $position_type )
				) {
					// Ensure 0 values can be used in `calc()` calculations.
					if ( '0' === $side_value || 0 === $side_value ) {
						$side_value = '0px';
					}

					// Ensure current side value also factors in the height of the logged in admin bar.
					$side_value = "calc($side_value + var(--wp-admin--admin-bar--height, 0px))";
				}

				$position_styles[] =
					array(
						'selector'     => "$selector",
						'declarations' => array(
							$side => $side_value,
						),
					);
			}
		}

		$position_styles[] =
			array(
				'selector'     => "$selector",
				'declarations' => array(
					'position' => $position_type,
					'z-index'  => '250', // TODO: This hard-coded value should live somewhere else.
				),
			);
	}

	if ( ! empty( $position_styles ) ) {
		/*
		 * Add to the style engine store to enqueue and render position styles.
		 */
		return gutenberg_style_engine_get_stylesheet_from_css_rules(
			$position_styles,
			array(
				'context'  => 'block-supports',
				'prettify' => false,
			)
		);
	}

	return '';
}

/**
 * Renders position styles to the block wrapper.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_position_support( $block_content, $block ) {
	$block_type           = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$has_position_support = block_has_support( $block_type, array( 'position' ), false );

	if (
		! $has_position_support ||
		empty( $block['attrs']['style']['position'] )
	) {
		return $block_content;
	}

	$style_attribute = _wp_array_get( $block, array( 'attrs', 'style' ), null );
	$class_name      = wp_unique_id( 'wp-container-' );
	$selector        = ".$class_name";
	$position_styles = array();
	$position_type   = _wp_array_get( $style_attribute, array( 'position', 'type' ), '' );

	if (
		in_array( $position_type, array( 'fixed', 'sticky' ), true )
	) {
		$sides = array( 'top', 'right', 'bottom', 'left' );

		foreach ( $sides as $side ) {
			$side_value = _wp_array_get( $style_attribute, array( 'position', $side ) );
			if ( null !== $side_value ) {
				/*
				* For fixed or sticky top positions,
				* ensure the value includes an offset for the logged in admin bar.
				*/
				if (
					'top' === $side &&
					( 'fixed' === $position_type || 'sticky' === $position_type )
				) {
					// Ensure 0 values can be used in `calc()` calculations.
					if ( '0' === $side_value || 0 === $side_value ) {
						$side_value = '0px';
					}

					// Ensure current side value also factors in the height of the logged in admin bar.
					$side_value = "calc($side_value + var(--wp-admin--admin-bar--height, 0px))";
				}

				$position_styles[] =
					array(
						'selector'     => $selector,
						'declarations' => array(
							$side => $side_value,
						),
					);
			}
		}

		$position_styles[] =
			array(
				'selector'     => $selector,
				'declarations' => array(
					'position' => $position_type,
					'z-index'  => '10', // TODO: This hard-coded value should live somewhere else.
				),
			);
	}

	if ( ! empty( $position_styles ) ) {
		/*
		 * Add to the style engine store to enqueue and render position styles.
		 */
		gutenberg_style_engine_get_stylesheet_from_css_rules(
			$position_styles,
			array(
				'context'  => 'block-supports',
				'prettify' => false,
			)
		);

		// Inject class name to block container markup.
		$content = new WP_HTML_Tag_Processor( $block_content );
		$content->next_tag();
		$content->add_class( $class_name );
		return (string) $content;
	}

	return $block_content;
}

// Register the block support. (overrides core one).
WP_Block_Supports::get_instance()->register(
	'position',
	array(
		'register_attribute' => 'gutenberg_register_position_support',
	)
);

if ( function_exists( 'wp_render_position_support' ) ) {
	remove_filter( 'render_block', 'wp_render_position_support' );
}
add_filter( 'render_block', 'gutenberg_render_position_support', 10, 2 );
