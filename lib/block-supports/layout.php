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
 * Generates the CSS corresponding to the provided layout.
 *
 * @param string  $class_prefix          Prefix for the CSS selector class name.
 * @param array   $layout                Layout object. The one that is passed has already checked the existance of default block layout.
 * @param boolean $has_block_gap_support Whether the theme has support for the block gap.
 *
 * @return array The CSS styles, keyed by classname.
 */
function gutenberg_get_layout_style( $class_prefix = 'wp-container-layout', $layout, $has_block_gap_support = false ) {
	$styles       = array();
	$class_prefix = 'wp-container-layout';
	$layout_type  = isset( $layout['type'] ) ? $layout['type'] : 'default';

	$style = '';
	if ( 'default' === $layout_type ) {
		$content_size = isset( $layout['contentSize'] ) ? $layout['contentSize'] : null;
		$wide_size    = isset( $layout['wideSize'] ) ? $layout['wideSize'] : null;

		$all_max_width_value  = $content_size ? $content_size : $wide_size;
		$wide_max_width_value = $wide_size ? $wide_size : $content_size;

		// Make sure there is a single CSS rule, and all tags are stripped for security.
		// TODO: Use `safecss_filter_attr` instead - once https://core.trac.wordpress.org/ticket/46197 is patched.
		$all_max_width_value  = wp_strip_all_tags( explode( ';', $all_max_width_value )[0] );
		$wide_max_width_value = wp_strip_all_tags( explode( ';', $wide_max_width_value )[0] );

		$style = '';
		if ( $content_size || $wide_size ) {
			// Add `allMaxWidth` class and styles.
			$selector = "{$class_prefix}__allMaxWidth--" . esc_attr( $all_max_width_value );
			$style    = '';
			$style    = ".$selector > * {";
			$style   .= 'max-width: ' . esc_html( $all_max_width_value ) . ';';
			$style   .= 'margin-left: auto !important;';
			$style   .= 'margin-right: auto !important;';
			$style   .= '}';

			$styles[ $selector ] = $style;

			// Add `wideMaxWidth` class and styles.
			$selector = "{$class_prefix}__wideMaxWidth--" . esc_attr( $wide_max_width_value );
			$style    = '';
			$style   .= ".$selector > .alignwide { max-width: " . esc_html( $wide_max_width_value ) . ';}';
			$style   .= ".$selector .alignfull { max-width: none; }";

			$styles[ $selector ] = $style;
		}

		// Add `type--default` class and styles.
		$selector = "{$class_prefix}__type--default";
		$style    = '';
		$style   .= ".$selector .alignleft { float: left; margin-right: 2em; }";
		$style   .= ".$selector .alignright { float: right; margin-left: 2em; }";

		$styles[ $selector ] = $style;

		if ( $has_block_gap_support ) {
			// Add `type--default--blockGap` class and styles.
			$selector = "{$class_prefix}__type--default--block-gap";
			$style    = '';
			$style   .= ".$selector > * { margin-top: 0; margin-bottom: 0; }";
			$style   .= ".$selector > * + * { margin-top: var( --wp--style--block-gap ); margin-bottom: 0; }";

			$styles[ $selector ] = $style;
		}
	} elseif ( 'flex' === $layout_type ) {
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

		// Add `type--flex` class and styles.
		$selector = "{$class_prefix}__type--flex";
		$style    = '';
		$style   .= ".$selector { display: flex; }";
		$style   .= ".$selector > * { margin: 0; }";

		$styles[ $selector ] = $style;

		if ( $has_block_gap_support ) {
			// Add `type--flex--block-gap` class and styles.
			$selector = "{$class_prefix}__type--flex--block-gap";
			$style    = '';
			$style   .= ".$selector { gap: var( --wp--style--block-gap, 0.5em ); }";

			$styles[ $selector ] = $style;
		} else {
			// Add `type--flex--gap` class and styles.
			$selector = "{$class_prefix}__type--flex--gap";
			$style    = '';
			$style   .= '.$selector { gap: 0.5em; }';

			$styles[ $selector ] = $style;
		}

		// Add `flex-wrap` class and styles.
		$selector = "{$class_prefix}__flexWrap--" . esc_attr( $flex_wrap );
		$style    = '';
		$style   .= ".$selector { flex-wrap: $flex_wrap; }";

		$styles[ $selector ] = $style;

		if ( 'horizontal' === $layout_orientation ) {
			// Add `orientation--horizontal` class and styles.
			$selector = "{$class_prefix}__orientation--horizontal";
			$style    = '';
			$style   .= ".$selector { align-items: center; }";

			$styles[ $selector ] = $style;
			/**
			 * Add this style only if is not empty for backwards compatibility,
			 * since we intend to convert blocks that had flex layout implemented
			 * by custom css.
			 */
			if ( ! empty( $layout['justifyContent'] ) && array_key_exists( $layout['justifyContent'], $justify_content_options ) ) {
				// Add `orientation--horizontal--justify-content` class and styles.
				$selector = "{$class_prefix}__orientation--horizontal--justify-content--" . esc_attr( $justify_content_options[ $layout['justifyContent'] ] );
				$style  = '';
				$style .= ".$selector { justify-content: {$justify_content_options[ $layout['justifyContent'] ]}; }";

				$styles[ $selector ] = $style;

				if ( ! empty( $layout['setCascadingProperties'] ) && $layout['setCascadingProperties'] ) {
					// Add `set-cascading-properties` class and styles.
					$selector = "{$class_prefix}__set-cascading-properties";
					$style  = '';
					$style .= ".$selector {";
					// --layout-justification-setting allows children to inherit the value regardless or row or column direction.
					$style .= "--layout-justification-setting: {$justify_content_options[ $layout['justifyContent'] ]};";
					$style .= '--layout-direction: row;';
					$style .= "--layout-wrap: $flex_wrap;";
					$style .= "--layout-justify: {$justify_content_options[ $layout['justifyContent'] ]};";
					$style .= '--layout-align: center;';
					$style .= '}';

					$styles[ $selector ] = $style;
				}
			}
		} else {
			// Add `orientation--vertical` class and styles.
			$selector = "{$class_prefix}__orientation--horizontal";
			$style    = '';
			$style   .= ".$selector { flex-direction: column; }";

			$styles[ $selector ] = $style;

			if ( ! empty( $layout['justifyContent'] ) && array_key_exists( $layout['justifyContent'], $justify_content_options ) ) {
				// Add `orientation--vertical--justify-content` class and styles.
				$selector = "{$class_prefix}__orientation--vertical--justify-content--" . esc_attr( $justify_content_options[ $layout['justifyContent'] ] );
				$style    = '';
				$style   .= ".$selector { align-items: {$justify_content_options[ $layout['justifyContent'] ]}; }";
				if ( ! empty( $layout['setCascadingProperties'] ) && $layout['setCascadingProperties'] ) {
					// Add `set-cascading-properties` class and styles.
					$selector = "{$class_prefix}__set-cascading-properties";
					$style  = '';
					$style .= ".$selector {";
					// --layout-justification-setting allows children to inherit the value regardless or row or column direction.
					$style .= "--layout-justification-setting: {$justify_content_options[ $layout['justifyContent'] ]};";
					$style .= '--layout-direction: column;';
					$style .= '--layout-justify: initial;';
					$style .= "--layout-align: {$justify_content_options[ $layout['justifyContent'] ]};";
					$style .= '}';

					$styles[ $selector ] = $style;
				}
			}
		}
	}

	return $styles;
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

	$styles = gutenberg_get_layout_style( 'wp-layout-container', $used_layout, $has_block_gap_support );
	// This assumes the hook only applies to blocks with a single wrapper.
	// I think this is a reasonable limitation for that particular hook.
	$content = preg_replace(
		'/' . preg_quote( 'class="', '/' ) . '/',
		'class="' . implode( ' ', array_keys( $styles ) ) . ' ',
		$block_content,
		1
	);

	$style = implode( ' ', array_values( $styles ) );

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
