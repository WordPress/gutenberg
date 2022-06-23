<?php
/**
 * WP_Style_Engine_Renderer
 *
 * A library of CSS rule generators and render functions.
 *
 * @TODO Consider splitting out the rule generators (?).
 * Or creating a base interface and then a bunch of separate render classes for each "layer", e.g.,
 * one for block supports, one for global styles.
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine_Renderer' ) ) {
	return;
}

/**
 * Renders CSS on the frontend.
 *
 * @access private
 */
class WP_Style_Engine_Renderer {
	/**
	 * Prints registered styles in the page head or footer.
	 *
	 * @TODO this shares code with the styles engine class in generate(). Centralize.
	 *
	 * @see $this->enqueue_block_support_styles
	 */
	public static function render_registered_block_supports_styles() {
		$style_engine         = WP_Style_Engine::get_instance();
		$block_support_styles = $style_engine->get_block_support_styles();

		if ( empty( $block_support_styles ) ) {
			return;
		}

		$output = '';

		foreach ( $block_support_styles as $selector => $css_definitions ) {
			$output .= self::generate_css_rule( $selector, $css_definitions, true );
		}

		echo "<style>\n$output</style>\n";
	}

	/**
	 * Filters incoming CSS properties against WordPress Core's allowed CSS attributes in wp-includes/kses.php.
	 *
	 * @param string $property_declaration A CSS property declaration, e.g., `color: 'pink'`.
	 *
	 * @return string A filtered CSS property. Empty if not allowed.
	 */
	public static function sanitize_property_declaration( $property_declaration ) {
		return esc_html( safecss_filter_attr( $property_declaration ) );
	}

	/**
	 * Creates a string consisting of CSS property declarations suitable for the value of an HTML element's style attribute.
	 *
	 * @param array $css_definitions An collection of CSS definitions `[ [ 'color' => 'red' ] ]`.
	 *
	 * @return string A concatenated string of CSS properties, e.g. `'color: red; font-size:12px'`
	 */
	public static function generate_inline_property_declarations( $css_definitions ) {
		$css_rule_inline = '';

		if ( empty( $css_definitions ) ) {
			return $css_rule_inline;
		}
		foreach ( $css_definitions as $definition => $value ) {
			$filtered_css = self::sanitize_property_declaration( "{$definition}: {$value}" );
			if ( ! empty( $filtered_css ) ) {
				$css_rule_inline .= $filtered_css . ';';
			}
		}
		return $css_rule_inline;
	}

	/**
	 * Creates a string consisting of a CSS rule
	 *
	 * @param string  $selector A CSS selector, e.g., `.some-class-name`.
	 * @param array   $css_definitions An collection of CSS definitions `[ [ 'color' => 'red' ] ]`.
	 * @param boolean $should_prettify Whether to print spaces and carriage returns.
	 *
	 * @return string A CSS rule, e.g. `'.some-selector { color: red; font-size:12px }'`
	 */
	public static function generate_css_rule( $selector, $css_definitions, $should_prettify = false ) {
		$css_rule_block = '';

		if ( ! $selector || empty( $css_definitions ) ) {
			return $css_rule_block;
		}

		$css_rule_block = $should_prettify ? "$selector {\n" : "$selector { ";

		foreach ( $css_definitions as $definition => $value ) {
			$filtered_css = self::sanitize_property_declaration( "{$definition}: {$value}" );
			if ( ! empty( $filtered_css ) ) {
				if ( $should_prettify ) {
					$css_rule_block .= "\t$filtered_css;\n";
				} else {
					$css_rule_block .= $filtered_css . ';';
				}
			}
		}
		$css_rule_block .= $should_prettify ? "}\n" : ' }';
		return $css_rule_block;
	}

	// @TODO The following method takes over the work of enqueuing block support styles for now.
	// Later we'd want to identify which styles we're rendering, e.g., is this a global styles ruleset,
	// so we can create appropriate "layers" / control specificity.
	// We could create separate blocks for each layer, e.g.,
	// wp_register_style( 'global-styles-layer', false, array(), true, true );
	// wp_add_inline_style( 'global-styles-layer', $styles );
	// wp_enqueue_style( 'global-styles-layer' );
	// Or build them and print them all out in one.
	// Just how, I don't know right now :D.

	/**
	 * Taken from gutenberg_enqueue_block_support_styles()
	 *
	 * This function takes care of adding inline styles
	 * in the proper place, depending on the theme in use.
	 *
	 * For block themes, it's loaded in the head.
	 * For classic ones, it's loaded in the body
	 * because the wp_head action  happens before
	 * the render_block.
	 *
	 * @see gutenberg_enqueue_block_support_styles()
	 *
	 * @param int $priority To set the priority for the add_action.
	 */
	public static function enqueue_block_support_styles( $priority = 10 ) {
		$action_hook_name = 'wp_footer';
		if ( wp_is_block_theme() ) {
			$action_hook_name = 'wp_head';
		}
		add_action(
			$action_hook_name,
			array( __CLASS__, 'render_registered_block_supports_styles' ),
			$priority
		);
	}
}

