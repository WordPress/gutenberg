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
		$block_support_styles = $style_engine->get_registered_styles();

		if ( empty( $block_support_styles ) ) {
			return;
		}

		$output = '';

		foreach ( $block_support_styles as $selector => $css_definitions ) {
			$output .= self::generate_css_rule( $selector, $css_definitions, array( 'prettify' => true ) );
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
	 * Creates a string consisting of a CSS rule.
	 *
	 * @param string $selector A CSS selector, e.g., `.some-class-name`.
	 * @param array  $css_definitions An collection of CSS definitions `[ [ 'color' => 'red' ] ]`.
	 * @param array  $options array(
	 *      'prettify' => (boolean) Whether to add carriage returns and indenting.
	 *      'indent' => (number) The number of tab indents to apply to the rule. Applies if `prettify` is `true`.
	 *  );.
	 *
	 * @return string A CSS rule, e.g. `'.some-selector { color: red; font-size:12px }'`
	 */
	public static function generate_css_rule( $selector, $css_definitions, $options = array() ) {
		$css_rule_block = '';

		if ( ! $selector || empty( $css_definitions ) ) {
			return $css_rule_block;
		}

		$defaults       = array(
			'prettify' => false,
			'indent'   => 0,
		);
		$options        = wp_parse_args( $options, $defaults );
		$indent         = str_repeat( "\t", $options['indent'] );
		$css_rule_block = $options['prettify'] ? "$indent$selector {\n" : "$selector { ";

		foreach ( $css_definitions as $definition => $value ) {
			$filtered_css = self::sanitize_property_declaration( "{$definition}: {$value}" );
			if ( ! empty( $filtered_css ) ) {
				if ( $options['prettify'] ) {
					$css_rule_block .= "\t$indent$filtered_css;\n";
				} else {
					$css_rule_block .= $filtered_css . ';';
				}
			}
		}
		$css_rule_block .= $options['prettify'] ? "$indent}\n" : ' }';
		return $css_rule_block;
	}

	// @TODO Using cascade layers should be opt-in.
	/**
	 * Builds layers and styles rules from registered layers and styles for output.
	 */
	public static function enqueue_cascade_layers() {
		$style_engine      = WP_Style_Engine::get_instance();
		$registered_layers = $style_engine->get_registered_styles();

		if ( empty( $registered_layers ) ) {
			return;
		}

		$layer_output  = array();
		$styles_output = '';

		foreach ( $style_engine::STYLE_LAYERS as $layer_name ) {
			if ( ! isset( $registered_layers[ $layer_name ] ) || empty( $registered_layers[ $layer_name ] ) ) {
				continue;
			}

			$layer_output[] = $layer_name;
			$styles_output .= "@layer {$layer_name} {\n";

			foreach ( $registered_layers[ $layer_name ] as $selector => $css_definitions ) {
				$styles_output .= self::generate_css_rule(
					$selector,
					$css_definitions,
					array(
						'prettify' => true,
						'indent'   => 1,
					)
				);
			}
			$styles_output .= '}';
		}

		if ( ! empty( $styles_output ) ) {
			$layer_output = '@layer ' . implode( ', ', $layer_output ) . ";\n";
			wp_register_style( 'wp-styles-layers', false, array(), true, true );
			wp_add_inline_style( 'wp-styles-layers', $layer_output . $styles_output );
			wp_enqueue_style( 'wp-styles-layers' );
		}
	}

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
	public static function enqueue_registered_styles( $priority = 10 ) {
		$action_hook_name = 'wp_footer';
		if ( wp_is_block_theme() ) {
			$action_hook_name = 'wp_head';
		}
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_cascade_layers' ) );
		add_action(
			$action_hook_name,
			array( __CLASS__, 'enqueue_cascade_layers' ),
			$priority
		);
	}
}

