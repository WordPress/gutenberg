<?php
/**
 * WP_Style_Engine
 *
 * Generates classnames and block styles.
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine' ) ) {
	return;
}

/**
 * Singleton class representing the style engine.
 *
 * Consolidates rendering block styles to reduce duplication and streamline
 * CSS styles generation.
 *
 * This class is for internal core usage and is not supposed to be used by extenders (plugins and/or themes).
 * This is a low-level API that may need to do breaking changes. Please, use gutenberg_style_engine_get_styles instead.
 *
 * @access private
 */
class WP_Style_Engine {
	/**
	 * Container for the main instance of the class.
	 *
	 * @var WP_Style_Engine|null
	 */
	private static $instance = null;

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * The instance will be created if it does not exist yet.
	 *
	 * @return WP_Style_Engine The main instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Returns classnames and CSS based on the values in a block attributes.styles object.
	 * Return values are parsed based on the instructions in WP_Style_Engine_Parser.
	 *
	 * @param array $block_styles Styles from a block's attributes object.
	 * @param array $options      array(
	 *     'selector'                   => (string) When a selector is passed, `generate()` will return a full CSS rule `$selector { ...rules }`, otherwise a concatenated string of properties and values.
	 *     'convert_vars_to_classnames' => (boolean) Whether to skip converting CSS var:? values to var( --wp--preset--* ) values. Default is `false`.
	 * );.
	 *
	 * @return array|null array(
	 *     'css'        => (string) A CSS ruleset formatted to be placed in an HTML `style` attribute or tag.  Default is a string of inline styles.
	 *     'classnames' => (string) Classnames separated by a space.
	 * );
	 */
	public function get_block_supports_styles( $block_styles, $options ) {
		if ( empty( $block_styles ) || ! is_array( $block_styles ) ) {
			return null;
		}

		$parser           = new WP_Style_Engine_Parser( $block_styles, $options );
		$css_declarations = new WP_Style_Engine_CSS_Declarations( $parser->get_css_declarations() );

		// The return object.
		$styles_output = array();

		// Return css, if any.
		$css = $css_declarations->get_declarations_string();
		if ( ! empty( $css ) ) {
			$styles_output['css']          = $css;
			$styles_output['declarations'] = $css_declarations->get_declarations();
			$css_selector                  = isset( $options['selector'] ) ? $options['selector'] : null;
			// Return an entire rule if there is a selector.
			if ( $css_selector ) {
				$styles_output['css'] = $css_selector . ' { ' . $css . ' }';
			}
		}

		// Return classnames, if any.
		$classnames = $parser->get_classnames_string();
		if ( ! empty( $classnames ) ) {
			$styles_output['classnames'] = $classnames;
		}

		return $styles_output;
	}
}

/**
 * Global public interface method to WP_Style_Engine->get_block_supports_styles to generate block styles from a single block style object.
 * See: https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/
 *
 * Example usage:
 *
 * $styles = wp_style_engine_get_block_supports_styles( array( 'color' => array( 'text' => '#cccccc' ) ) );
 * // Returns `array( 'css' => 'color: #cccccc', 'classnames' => 'has-color' )`.
 *
 * @access public
 *
 * @param array         $block_styles The value of a block's attributes.style.
 * @param array<string> $options      An array of options to determine the output.
 *
 * @return array<string>|null array(
 *     'styles'     => (string) A CSS ruleset formatted to be placed in an HTML `style` attribute or tag.
 *     'classnames' => (string) Classnames separated by a space.
 * );
 */
function wp_style_engine_get_block_supports_styles( $block_styles, $options = array() ) {
	if ( class_exists( 'WP_Style_Engine' ) ) {
		$style_engine = WP_Style_Engine::get_instance();
		return $style_engine->get_block_supports_styles( $block_styles, $options );
	}
	return null;
}
