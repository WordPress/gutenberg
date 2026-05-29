<?php
/**
 * Border block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style attribute used by the border feature if needed for block
 * types that support borders.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_border_support( $block_type ) {
	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( block_has_support( $block_type, array( '__experimentalBorder' ) ) && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}

	if ( gutenberg_has_border_feature_support( $block_type, 'color' ) && ! array_key_exists( 'borderColor', $block_type->attributes ) ) {
		$block_type->attributes['borderColor'] = array(
			'type' => 'string',
		);
	}
}

/**
 * Adds CSS classes and inline styles for border styles to the incoming
 * attributes array. This will be applied to the block markup in the front-end.
 *
 * @param WP_Block_Type $block_type       Block type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Border CSS classes and inline styles.
 */
function gutenberg_apply_border_support( $block_type, $block_attributes ) {
	if ( wp_should_skip_block_supports_serialization( $block_type, 'border' ) ) {
		return array();
	}

	$border_block_styles      = array();
	$has_border_color_support = gutenberg_has_border_feature_support( $block_type, 'color' );
	$has_border_width_support = gutenberg_has_border_feature_support( $block_type, 'width' );
	$has_border_style_support = gutenberg_has_border_feature_support( $block_type, 'style' );

	// Border radius.
	if (
		gutenberg_has_border_feature_support( $block_type, 'radius' ) &&
		isset( $block_attributes['style']['border']['radius'] ) &&
		! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'radius' )
	) {
		$border_radius = $block_attributes['style']['border']['radius'];

		if ( is_numeric( $border_radius ) ) {
			$border_radius .= 'px';
		}

		$border_block_styles['radius'] = $border_radius;
	}

	// Border style.
	if (
		$has_border_style_support &&
		isset( $block_attributes['style']['border']['style'] ) &&
		! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'style' )
	) {
		$border_block_styles['style'] = $block_attributes['style']['border']['style'];
	}

	// Border width.
	if (
		$has_border_width_support &&
		isset( $block_attributes['style']['border']['width'] ) &&
		! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'width' )
	) {
		$border_width = $block_attributes['style']['border']['width'];

		// This check handles original unitless implementation.
		if ( is_numeric( $border_width ) ) {
			$border_width .= 'px';
		}

		$border_block_styles['width'] = $border_width;
	}

	// Border color.
	if (
		$has_border_color_support &&
		! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'color' )
	) {
		$preset_border_color          = array_key_exists( 'borderColor', $block_attributes ) ? "var:preset|color|{$block_attributes['borderColor']}" : null;
		$custom_border_color          = $block_attributes['style']['border']['color'] ?? null;
		$border_block_styles['color'] = $preset_border_color ? $preset_border_color : $custom_border_color;
	}

	// Generate styles for individual border sides.
	if ( $has_border_color_support || $has_border_width_support ) {
		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			$border                       = $block_attributes['style']['border'][ $side ] ?? null;
			$border_side_values           = array(
				'width' => isset( $border['width'] ) && ! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'width' ) ? $border['width'] : null,
				'color' => isset( $border['color'] ) && ! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'color' ) ? $border['color'] : null,
				'style' => isset( $border['style'] ) && ! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'style' ) ? $border['style'] : null,
			);
			$border_block_styles[ $side ] = $border_side_values;
		}
	}

	// Collect classes and styles.
	$attributes = array();
	$styles     = gutenberg_style_engine_get_styles( array( 'border' => $border_block_styles ) );

	if ( ! empty( $styles['classnames'] ) ) {
		$attributes['class'] = $styles['classnames'];
	}

	if ( ! empty( $styles['css'] ) ) {
		$attributes['style'] = $styles['css'];
	}

	return $attributes;
}

/**
 * Determines whether a border style is inherited from the resolved global
 * styles for a given block instance.
 *
 * Mirrors the JS helper `getInheritedBorderStyles` in
 * `packages/block-editor/src/hooks/border.js`. Checks two cascade levels:
 * the block type's global styles, and the active block style variation
 * (derived from the block instance's class name). At each level it considers
 * the `border.style` shorthand and per-side `border.{side}.style` values.
 *
 * Root-level `styles.border.style` is intentionally excluded: theme.json's
 * root border styles compile to a `body` selector, and `border-style` is not
 * a CSS-inherited property, so a root border style does not cascade to inner
 * block borders. Treating it as inherited would suppress the fallback even
 * when no border style actually applies to the block.
 *
 * @param WP_Block_Type $block_type       Block type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array {
 *     @type bool $shorthand Whether an inherited shorthand style applies.
 *     @type bool $top       Whether an inherited style applies to the top side.
 *     @type bool $right     Whether an inherited style applies to the right side.
 *     @type bool $bottom    Whether an inherited style applies to the bottom side.
 *     @type bool $left      Whether an inherited style applies to the left side.
 * }
 */
function gutenberg_get_inherited_border_styles( $block_type, $block_attributes ) {
	$result = array(
		'shorthand' => false,
		'top'       => false,
		'right'     => false,
		'bottom'    => false,
		'left'      => false,
	);

	if ( ! class_exists( 'WP_Theme_JSON_Resolver_Gutenberg' ) ) {
		return $result;
	}

	$block_name = $block_type instanceof WP_Block_Type ? $block_type->name : null;
	if ( ! $block_name ) {
		return $result;
	}

	$tree     = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
	$raw_data = method_exists( $tree, 'get_raw_data' ) ? $tree->get_raw_data() : array();
	$styles   = $raw_data['styles'] ?? array();

	$block_border     = $styles['blocks'][ $block_name ]['border'] ?? array();
	$variation_border = array();

	// Resolve the active block style variation from the block instance's
	// class names against the registered variations for the block type.
	$class_name = $block_attributes['className'] ?? '';
	if ( $class_name ) {
		$registered = wp_get_block_styles( $block_name );
		$variation  = gutenberg_get_variation_name_from_class( $class_name, $registered );
		if ( $variation ) {
			$variation_border =
				$styles['blocks'][ $block_name ]['variations'][ $variation ]['border']
				?? array();
		}
	}

	// `none` and `hidden` are non-rendering border styles. Treating them as
	// inherited would suppress the fallback when a user adds a color/width
	// on a block whose theme cascade sets `style: 'none'`, leaving the
	// user's change invisible. Exclude them so the fallback can emit
	// `solid` and keep the user's action visible.
	$is_rendering_style = static function ( $value ) {
		return ! empty( $value ) && 'none' !== $value && 'hidden' !== $value;
	};

	$shorthand =
		$is_rendering_style( $block_border['style'] ?? null ) ||
		$is_rendering_style( $variation_border['style'] ?? null );

	$result['shorthand'] = $shorthand;
	foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
		$result[ $side ] =
			$shorthand ||
			$is_rendering_style( $block_border[ $side ]['style'] ?? null ) ||
			$is_rendering_style( $variation_border[ $side ]['style'] ?? null );
	}

	return $result;
}

/**
 * Returns the first registered block style variation name found in a class
 * string. Mirrors the JS `getVariationNameFromClass` helper.
 *
 * @param string $class_name        Block class string.
 * @param array  $registered_styles Registered styles for the block type.
 *
 * @return string|null Variation name or null if none matched.
 */
function gutenberg_get_variation_name_from_class( $class_name, $registered_styles ) {
	if ( ! $class_name || empty( $registered_styles ) ) {
		return null;
	}

	$prefix     = 'is-style-';
	$prefix_len = strlen( $prefix );
	$names      = array();
	foreach ( preg_split( '/\s+/', $class_name ) as $name ) {
		if ( strpos( $name, $prefix ) === 0 ) {
			$candidate = substr( $name, $prefix_len );
			if ( 'default' !== $candidate ) {
				$names[] = $candidate;
			}
		}
	}

	foreach ( $names as $candidate ) {
		foreach ( $registered_styles as $style ) {
			if ( isset( $style['name'] ) && $style['name'] === $candidate ) {
				return $candidate;
			}
		}
	}

	return null;
}

/**
 * Checks whether the current block type supports the border feature requested.
 *
 * If the `__experimentalBorder` support flag is a boolean `true` all border
 * support features are available. Otherwise, the specific feature's support
 * flag nested under `experimentalBorder` must be enabled for the feature
 * to be opted into.
 *
 * @param WP_Block_Type $block_type    Block type to check for support.
 * @param string        $feature       Name of the feature to check support for.
 * @param mixed         $default_value Fallback value for feature support, defaults to false.
 *
 * @return boolean                  Whether or not the feature is supported.
 */
function gutenberg_has_border_feature_support( $block_type, $feature, $default_value = false ) {
	// Check if all border support features have been opted into via `"__experimentalBorder": true`.
	if ( $block_type instanceof WP_Block_Type ) {
		$block_type_supports_border = $block_type->supports['__experimentalBorder'] ?? $default_value;
		if ( true === $block_type_supports_border ) {
			return true;
		}
	}

	// Check if the specific feature has been opted into individually
	// via nested flag under `__experimentalBorder`.
	return block_has_support( $block_type, array( '__experimentalBorder', $feature ), $default_value );
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'border',
	array(
		'register_attribute' => 'gutenberg_register_border_support',
		'apply'              => 'gutenberg_apply_border_support',
	)
);

/**
 * Computes the per-side border-style fallback styles for a block instance.
 *
 * Mirrors the JS helper `getBorderStyleFallbacks` in
 * `packages/block-editor/src/hooks/border.js`. Keep the two implementations
 * in sync.
 *
 * @param array $block_attributes Block attributes (typically `$block['attrs']`).
 * @param array $inherited        Inheritance flags returned by
 *                                {@see gutenberg_get_inherited_border_styles()}.
 *
 * @return string[] Inline CSS declarations such as `border-top-style:solid` for
 *                  sides that need a fallback style.
 */
function gutenberg_get_border_style_fallbacks( $block_attributes, $inherited ) {
	$border              = $block_attributes['style']['border'] ?? array();
	$border_color_preset = $block_attributes['borderColor'] ?? '';

	$has_shorthand_value =
		! empty( $border_color_preset ) ||
		! empty( $border['color'] ) ||
		! empty( $border['width'] );
	$has_shorthand_style = ! empty( $border['style'] );

	$declarations = array();
	foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
		if ( ! empty( $inherited[ $side ] ) ) {
			continue;
		}

		$side_border = $border[ $side ] ?? array();

		// If the cascade already provides a visible style for this side —
		// either an explicit per-side style or a shorthand style which
		// applies to every side via CSS — no fallback is needed.
		if ( ! empty( $side_border['style'] ) || $has_shorthand_style ) {
			continue;
		}

		$side_has_value = ! empty( $side_border['color'] ) || ! empty( $side_border['width'] );

		// A fallback is needed if the side has its own color/width without
		// a style, or if the shorthand provides color/width but no style
		// (which would otherwise leave this side invisible).
		if ( ! $side_has_value && ! $has_shorthand_value ) {
			continue;
		}

		$declarations[] = "border-{$side}-style:solid";
	}

	return $declarations;
}

/**
 * Backward-compatibility fallback for border block support. Historically a
 * CSS `:where()` rule in `common.scss` ensured that any block with a border
 * color or width but no `border-style` would still render as a `solid`
 * border. That rule has been removed in favour of intelligent defaults
 * applied at edit time. For content saved before that change — or for any
 * other path that does not pass through the edit-time helper — this filter
 * injects `border-{side}-style: solid` directly into the rendered block
 * wrapper so the border remains visible without requiring a re-save.
 *
 * Hooked into `render_block` rather than the `apply` callback of the
 * border block support because `WP_Block_Supports::apply_block_supports()`
 * is only invoked via `get_block_wrapper_attributes()` from inside a
 * dynamic block's `render_callback`. Static blocks (Group, Paragraph,
 * Heading, etc.) bake their wrapper attributes in at save time and never
 * reach that path, so a `render_block` filter is needed to cover them.
 * Mirrors the JS render-time fallback in `useBlockProps` at
 * `packages/block-editor/src/hooks/border.js`.
 *
 * @param string $block_content Rendered block HTML.
 * @param array  $block         Parsed block array.
 *
 * @return string Block HTML with the fallback styles injected when needed.
 */
function gutenberg_render_block_border_fallback( $block_content, $block ) {
	if ( ! $block_content || empty( $block['blockName'] ) ) {
		return $block_content;
	}

	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	if ( ! $block_type instanceof WP_Block_Type ) {
		return $block_content;
	}

	if ( ! gutenberg_has_border_feature_support( $block_type, 'style' ) ) {
		return $block_content;
	}

	if ( wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'style' ) ) {
		return $block_content;
	}

	$attrs        = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();
	$inherited    = gutenberg_get_inherited_border_styles( $block_type, $attrs );
	$declarations = gutenberg_get_border_style_fallbacks( $attrs, $inherited );

	if ( empty( $declarations ) ) {
		return $block_content;
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );
	if ( ! $processor->next_tag() ) {
		return $block_content;
	}

	$existing_style = $processor->get_attribute( 'style' );
	$existing_style = is_string( $existing_style ) ? rtrim( trim( $existing_style ), ';' ) : '';

	$new_style = $existing_style;
	if ( '' !== $new_style ) {
		$new_style .= ';';
	}
	$new_style .= implode( ';', $declarations ) . ';';

	$processor->set_attribute( 'style', $new_style );

	return $processor->get_updated_html();
}
add_filter( 'render_block', 'gutenberg_render_block_border_fallback', 10, 2 );
