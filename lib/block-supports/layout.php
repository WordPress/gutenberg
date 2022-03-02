<?php
/**
 * Layout block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the layout block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_layout_support( $block_type ) {
	$support_layout = gutenberg_block_has_support( $block_type, array( '__experimentalLayout' ), false );
	if ( $support_layout ) {
		if ( ! $block_type->attributes ) {
			$block_type->attributes = array();
		}

		if ( ! array_key_exists( 'layout', $block_type->attributes ) ) {
			$block_type->attributes['layout'] = array(
				'type' => 'object',
			);
		}
	}
}

/**
 * Generates styles for the default flow layout type.
 *
 * @param array   $layout                Layout object.
 * @param boolean $has_block_gap_support Whether the theme has support for the block gap.
 * @param string  $gap_value             The block gap value to apply.
 *
 * @return array An array of class names corresponding to the generated layout CSS.
 */
function gutenberg_generate_layout_style_flow( $layout, $has_block_gap_support = false, $gap_value = null ) {
	$style_engine = WP_Style_Engine_Gutenberg::get_instance();
	$class_names  = array();

	$content_size = isset( $layout['contentSize'] ) ? $layout['contentSize'] : '';
	$wide_size    = isset( $layout['wideSize'] ) ? $layout['wideSize'] : '';

	$all_max_width_value  = $content_size ? $content_size : $wide_size;
	$wide_max_width_value = $wide_size ? $wide_size : $content_size;

	// Make sure there is a single CSS rule, and all tags are stripped for security.
	// TODO: Use `safecss_filter_attr` instead - once https://core.trac.wordpress.org/ticket/46197 is patched.
	$all_max_width_value  = wp_strip_all_tags( explode( ';', $all_max_width_value )[0] );
	$wide_max_width_value = wp_strip_all_tags( explode( ';', $wide_max_width_value )[0] );

	// Add universal styles for all default layouts.
	// Add left align rule.
	$class_names[] = $style_engine->add_style(
		'wp-layout-flow',
		array(
			'selector' => '.alignleft',
			'rules'    => array(
				'float'        => 'left',
				'margin-right' => '2em',
				'margin-left'  => '0',
			),
		)
	);

	// Add right align rule.
	$class_names[] = $style_engine->add_style(
		'wp-layout-flow',
		array(
			'selector' => '.alignright',
			'rules'    => array(
				'float'        => 'right',
				'margin-left'  => '2em',
				'margin-right' => '0',
			),
		)
	);

	if ( $content_size || $wide_size ) {
		// Add value specific content size.
		$class_names[] = $style_engine->add_style(
			'wp-layout-flow-content-size',
			array(
				'suffix'   => $all_max_width_value,
				'selector' => '> :where(:not(.alignleft):not(.alignright))',
				'rules'    => array(
					'max-width'    => esc_html( $all_max_width_value ),
					'margin-left'  => 'auto !important',
					'margin-right' => 'auto !important',
				),
			)
		);

		// Add value specific wide size.
		$class_names[] = $style_engine->add_style(
			'wp-layout-flow-wide-size',
			array(
				'suffix'   => $wide_max_width_value,
				'selector' => '> .alignwide',
				'rules'    => array(
					'max-width' => esc_html( $wide_max_width_value ),
				),
			)
		);

		// Add universal full width.
		$class_names[] = $style_engine->add_style(
			'wp-layout-flow',
			array(
				'selector' => '> .alignfull',
				'rules'    => array(
					'max-width' => 'none',
				),
			)
		);
	}

	if ( $has_block_gap_support ) {
		if ( ! $gap_value ) {
			$class_names[] = $style_engine->add_style(
				'wp-layout-flow-global-gap',
				array(
					'selector' => '> *',
					'rules'    => array(
						'margin-top'    => '0',
						'margin-bottom' => '0',
					),
				)
			);
			$class_names[] = $style_engine->add_style(
				'wp-layout-flow-global-gap',
				array(
					'selector' => '> * + *',
					'rules'    => array(
						'margin-top'    => 'var( --wp--style--block-gap )',
						'margin-bottom' => '0',
					),
				)
			);
		} else {
			$class_names[] = $style_engine->add_style(
				'wp-layout-flow-custom-gap',
				array(
					'suffix'   => $gap_value,
					'selector' => '> *',
					'rules'    => array(
						'margin-top'    => '0',
						'margin-bottom' => '0',
					),
				)
			);
			$class_names[] = $style_engine->add_style(
				'wp-layout-flow-custom-gap',
				array(
					'suffix'   => $gap_value,
					'selector' => '> * + *',
					'rules'    => array(
						'margin-top'    => $gap_value,
						'margin-bottom' => '0',
					),
				)
			);
		}
	}

	return $class_names;
}

/**
 * Generates styles for the flex layout type.
 *
 * @param array   $layout                Layout object.
 * @param boolean $has_block_gap_support Whether the theme has support for the block gap.
 * @param string  $gap_value             The block gap value to apply.
 *
 * @return array An array of class names corresponding to the generated layout CSS.
 */
function gutenberg_generate_layout_style_flex( $layout, $has_block_gap_support = false, $gap_value = null ) {
	$style_engine       = WP_Style_Engine_Gutenberg::get_instance();
	$class_names        = array();
	$layout_orientation = isset( $layout['orientation'] ) ? $layout['orientation'] : 'horizontal';

	$justify_content_options = array(
		'left'   => 'flex-start',
		'right'  => 'flex-end',
		'center' => 'center',
	);

	if ( 'horizontal' === $layout_orientation ) {
		$justify_content_options += array( 'space-between' => 'space-between' );
	}

	$flex_wrap_options = array( 'wrap', 'nowrap' );
	$flex_wrap         = ! empty( $layout['flexWrap'] ) && in_array( $layout['flexWrap'], $flex_wrap_options, true ) ?
		$layout['flexWrap'] :
		'wrap';

	$class_names[] = $style_engine->add_style(
		'wp-layout-flex',
		array(
			'rules' => array(
				'display' => 'flex',
				'gap'     => '0.5em',
			),
		)
	);

	$class_names[] = $style_engine->add_style(
		'wp-layout-flex',
		array(
			'selector' => '> *',
			'rules'    => array(
				'margin' => '0',
			),
		)
	);

	$class_names[] = $style_engine->add_style(
		'wp-layout-flex',
		array(
			'suffix' => $flex_wrap,
			'rules'  => array(
				'flex-wrap' => $flex_wrap,
			),
		)
	);

	if ( $has_block_gap_support ) {
		if ( ! $gap_value ) {
			$class_names[] = $style_engine->add_style(
				'wp-layout-flex-global-gap',
				array(
					'rules' => array(
						'gap' => 'var( --wp--style--block-gap, 0.5em )',
					),
				)
			);
		} else {
			$class_names[] = $style_engine->add_style(
				'wp-layout-flex-custom-gap',
				array(
					'suffix' => $gap_value,
					'rules'  => array(
						'gap' => $gap_value,
					),
				)
			);
		}
	}

	if ( 'horizontal' === $layout_orientation ) {
		$class_names[] = $style_engine->add_style(
			'wp-layout-flex-orientation-horizontal',
			array(
				'rules' => array(
					'align-items' => 'center',
				),
			)
		);

		/**
		 * Add this style only if is not empty for backwards compatibility,
		 * since we intend to convert blocks that had flex layout implemented
		 * by custom css.
		 */
		if ( ! empty( $layout['justifyContent'] ) && array_key_exists( $layout['justifyContent'], $justify_content_options ) ) {
			$class_names[] = $style_engine->add_style(
				'wp-layout-flex-orientation-horizontal',
				array(
					'suffix' => $justify_content_options[ $layout['justifyContent'] ],
					'rules'  => array(
						'justify-content' => $justify_content_options[ $layout['justifyContent'] ],
					),
				)
			);
		}
	} else {
		$class_names[] = $style_engine->add_style(
			'wp-layout-flex-orientation-vertical',
			array(
				'rules' => array(
					'flex-direction' => 'column',
				),
			)
		);

		if ( ! empty( $layout['justifyContent'] ) && array_key_exists( $layout['justifyContent'], $justify_content_options ) ) {
			$class_names[] = $style_engine->add_style(
				'wp-layout-flex-orientation-vertical',
				array(
					'suffix' => $justify_content_options[ $layout['justifyContent'] ],
					'rules'  => array(
						'align-items' => $justify_content_options[ $layout['justifyContent'] ],
					),
				)
			);
		} else {
			$class_names[] = $style_engine->add_style(
				'wp-layout-flex-orientation-vertical',
				array(
					'suffix' => 'flex-start',
					'rules'  => array(
						'align-items' => 'flex-start',
					),
				)
			);
		}
	}

	return $class_names;
}

/**
 * Generates the CSS corresponding to the provided layout.
 *
 * @param array   $layout                Layout object. The one that is passed has already checked the existence of default block layout.
 * @param boolean $has_block_gap_support Whether the theme has support for the block gap.
 * @param string  $gap_value             The block gap value to apply.
 *
 * @return array An array of class names corresponding to the generated layout CSS.
 */
function gutenberg_get_layout_style( $layout, $has_block_gap_support = false, $gap_value = null ) {
	$layout_type = isset( $layout['type'] ) ? $layout['type'] : 'flow';
	$class_names = array();

	if ( 'flow' === $layout_type ) {
		$class_names = gutenberg_generate_layout_style_flow( $layout, $has_block_gap_support, $gap_value );
	} elseif ( 'flex' === $layout_type ) {
		$class_names = gutenberg_generate_layout_style_flex( $layout, $has_block_gap_support, $gap_value );
	}

	return array_unique( $class_names );
}

/**
 * Renders the layout config to the block wrapper.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_layout_support_flag( $block_content, $block ) {
	$block_type     = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$support_layout = gutenberg_block_has_support( $block_type, array( '__experimentalLayout' ), false );

	if ( ! $support_layout ) {
		return $block_content;
	}

	$block_gap             = gutenberg_get_global_settings( array( 'spacing', 'blockGap' ) );
	$default_layout        = gutenberg_get_global_settings( array( 'layout' ) );
	$has_block_gap_support = isset( $block_gap ) ? null !== $block_gap : false;
	$default_block_layout  = _wp_array_get( $block_type->supports, array( '__experimentalLayout', 'default' ), array() );
	$used_layout           = isset( $block['attrs']['layout'] ) ? $block['attrs']['layout'] : $default_block_layout;
	if ( isset( $used_layout['inherit'] ) && $used_layout['inherit'] ) {
		if ( ! $default_layout ) {
			return $block_content;
		}
		$used_layout = $default_layout;
	}

	$gap_value = _wp_array_get( $block, array( 'attrs', 'style', 'spacing', 'blockGap' ) );
	// Skip if gap value contains unsupported characters.
	// Regex for CSS value borrowed from `safecss_filter_attr`, and used here
	// because we only want to match against the value, not the CSS attribute.
	$gap_value   = preg_match( '%[\\\(&=}]|/\*%', $gap_value ) ? null : $gap_value;
	$class_names = gutenberg_get_layout_style( $used_layout, $has_block_gap_support, $gap_value );
	// This assumes the hook only applies to blocks with a single wrapper.
	// I think this is a reasonable limitation for that particular hook.
	$content = preg_replace(
		'/' . preg_quote( 'class="', '/' ) . '/',
		'class="' . esc_attr( implode( ' ', $class_names ) ) . ' ',
		$block_content,
		1
	);

	return $content;
}

// Register the block support. (overrides core one).
WP_Block_Supports::get_instance()->register(
	'layout',
	array(
		'register_attribute' => 'gutenberg_register_layout_support',
	)
);
if ( function_exists( 'wp_render_layout_support_flag' ) ) {
	remove_filter( 'render_block', 'wp_render_layout_support_flag' );
}
add_filter( 'render_block', 'gutenberg_render_layout_support_flag', 10, 2 );

/**
 * For themes without theme.json file, make sure
 * to restore the inner div for the group block
 * to avoid breaking styles relying on that div.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_restore_group_inner_container( $block_content, $block ) {
	$tag_name                         = isset( $block['attrs']['tagName'] ) ? $block['attrs']['tagName'] : 'div';
	$group_with_inner_container_regex = sprintf(
		'/(^\s*<%1$s\b[^>]*wp-block-group(\s|")[^>]*>)(\s*<div\b[^>]*wp-block-group__inner-container(\s|")[^>]*>)((.|\S|\s)*)/U',
		preg_quote( $tag_name, '/' )
	);
	if (
		'core/group' !== $block['blockName'] ||
		WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ||
		1 === preg_match( $group_with_inner_container_regex, $block_content ) ||
		( isset( $block['attrs']['layout']['type'] ) && 'default' !== $block['attrs']['layout']['type'] )
	) {
		return $block_content;
	}

	$replace_regex   = sprintf(
		'/(^\s*<%1$s\b[^>]*wp-block-group[^>]*>)(.*)(<\/%1$s>\s*$)/ms',
		preg_quote( $tag_name, '/' )
	);
	$updated_content = preg_replace_callback(
		$replace_regex,
		function( $matches ) {
			return $matches[1] . '<div class="wp-block-group__inner-container">' . $matches[2] . '</div>' . $matches[3];
		},
		$block_content
	);
	return $updated_content;
}

if ( function_exists( 'wp_restore_group_inner_container' ) ) {
	remove_filter( 'render_block', 'wp_restore_group_inner_container', 10, 2 );
}
add_filter( 'render_block', 'gutenberg_restore_group_inner_container', 10, 2 );


/**
 * For themes without theme.json file, make sure
 * to restore the outer div for the aligned image block
 * to avoid breaking styles relying on that div.
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 * @return string Filtered block content.
 */
function gutenberg_restore_image_outer_container( $block_content, $block ) {
	$image_with_align = '/(^\s*<figure\b[^>]*)\bwp-block-image\b([^"]*\b(?:alignleft|alignright|aligncenter)\b[^>]*>.*<\/figure>)/U';

	if (
		'core/image' !== $block['blockName'] ||
		WP_Theme_JSON_Resolver::theme_has_support() ||
		0 === preg_match( $image_with_align, $block_content )
	) {
		return $block_content;
	}

	$updated_content = preg_replace_callback(
		$image_with_align,
		static function( $matches ) {
			return '<div class="wp-block-image">' . $matches[1] . $matches[2] . '</div>';
		},
		$block_content
	);
	return $updated_content;
}

add_filter( 'render_block', 'gutenberg_restore_image_outer_container', 10, 2 );
