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
	 * Private constructor to prevent instantiation.
	 */
	private function __construct() {
		// Register the hook callback to render stored styles to the page.
		static::register_actions( array( __CLASS__, 'process_and_enqueue_stored_styles' ) );
	}

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * The instance will be created if it does not exist yet.
	 *
	 * @return WP_Style_Engine The main instance.
	 */
	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}

		return static::$instance;
	}

	/**
	 * Stores a CSS rule using the provide CSS selector and CSS declarations.
	 *
	 * @param string $store_key        A valid store key.
	 * @param string $css_selector     When a selector is passed, the function will return a full CSS rule `$selector { ...rules }`, otherwise a concatenated string of properties and values.
	 * @param array  $css_declarations An array of parsed CSS property => CSS value pairs.
	 *
	 * @return void.
	 */
	public static function store_css_rule( $store_key, $css_selector, $css_declarations ) {
		if ( empty( $store_key ) || empty( $css_selector ) || empty( $css_declarations ) ) {
			return;
		}
		static::get_store( $store_key )->add_rule( $css_selector )->add_declarations( $css_declarations );
	}

	/**
	 * Returns a store by store key.
	 *
	 * @param string $store_key A store key.
	 *
	 * @return WP_Style_Engine_CSS_Rules_Store
	 */
	public static function get_store( $store_key ) {
		return WP_Style_Engine_CSS_Rules_Store::get_store( $store_key );
	}

	/**
	 * Taken from gutenberg_enqueue_block_support_styles()
	 *
	 * This function takes care of registering hooks to add inline styles
	 * in the proper place, depending on the theme in use.
	 *
	 * For block themes, it's loaded in the head.
	 * For classic ones, it's loaded in the body
	 * because the wp_head action  happens before
	 * the render_block.
	 *
	 * @param callable $callable A user-defined callback function for a WordPress hook.
	 * @param int      $priority To set the priority for the add_action.
	 *
	 * @see gutenberg_enqueue_block_support_styles()
	 */
	protected static function register_actions( $callable, $priority = 10 ) {
		if ( ! $callable ) {
			return;
		}
		$action_hook_name = 'wp_footer';
		if ( wp_is_block_theme() ) {
			$action_hook_name = 'wp_head';
		}
		add_action( 'wp_enqueue_scripts', $callable );
		add_action(
			$action_hook_name,
			$callable,
			$priority
		);
	}

	/**
	 * Fetches, processes and compiles stored styles, then renders them to the page.
	 */
	public static function process_and_enqueue_stored_styles() {
		$stores = WP_Style_Engine_CSS_Rules_Store::get_stores();

		foreach ( $stores as $key => $store ) {
			$processor = new WP_Style_Engine_Processor();
			$processor->add_store( $store );
			$styles = $processor->get_css();

			if ( ! empty( $styles ) ) {
				wp_register_style( $key, false, array(), true, true );
				wp_add_inline_style( $key, $styles );
				wp_enqueue_style( $key );
			}
		}
	}

	/**
	 * Returns compiled CSS from css_declarations.
	 *
	 * @param array  $css_declarations An array of parsed CSS property => CSS value pairs.
	 * @param string $css_selector     When a selector is passed, the function will return a full CSS rule `$selector { ...rules }`, otherwise a concatenated string of properties and values.
	 *
	 * @return string A compiled CSS string.
	 */
	public static function compile_css( $css_declarations, $css_selector ) {
		if ( empty( $css_declarations ) || ! is_array( $css_declarations ) ) {
			return '';
		}

		// Return an entire rule if there is a selector.
		if ( $css_selector ) {
			$css_rule = new WP_Style_Engine_CSS_Rule( $css_selector, $css_declarations );
			return $css_rule->get_css();
		}
		$css_declarations = new WP_Style_Engine_CSS_Declarations( $css_declarations );
		return $css_declarations->get_declarations_string();
	}

	/**
	 * Returns a compiled stylesheet from stored CSS rules.
	 *
	 * @param WP_Style_Engine_CSS_Rule[] $css_rules An array of WP_Style_Engine_CSS_Rule objects from a store or otherwise.
	 *
	 * @return string A compiled stylesheet from stored CSS rules.
	 */
	public static function compile_stylesheet_from_css_rules( $css_rules ) {
		$processor = new WP_Style_Engine_Processor();
		$processor->add_rules( $css_rules );
		return $processor->get_css();
	}
}

/**
 * Global public interface method to generate styles from a single style object, e.g.,
 * the value of a block's attributes.style object or the top level styles in theme.json.
 * See: https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/theme-json-living/#styles and
 * https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/
 *
 * Example usage:
 *
 * $styles = wp_style_engine_get_styles( array( 'color' => array( 'text' => '#cccccc' ) ) );
 * // Returns `array( 'css' => 'color: #cccccc', 'declarations' => array( 'color' => '#cccccc' ), 'classnames' => 'has-color' )`.
 *
 * @access public
 *
 * @param array         $block_styles The style object.
 * @param array<string> $options      array(
 *     'context'                    => (string) An identifier describing the origin of the style object, e.g., 'block-supports' or 'global-styles'. Default is 'block-supports'.
 *     'enqueue'                    => (boolean) When `true` will attempt to store and enqueue for rendering on the frontend.
 *     'convert_vars_to_classnames' => (boolean) Whether to skip converting CSS var:? values to var( --wp--preset--* ) values. Default is `false`.
 *     'selector'                   => (string) When a selector is passed, `generate()` will return a full CSS rule `$selector { ...rules }`, otherwise a concatenated string of properties and values.
 * );.
 *
 * @return array<string>|null array(
 *     'css'           => (string) A CSS ruleset or declarations block formatted to be placed in an HTML `style` attribute or tag.
 *     'declarations'  => (array) An array of property/value pairs representing parsed CSS declarations.
 *     'classnames'    => (string) Classnames separated by a space.
 * );
 */
function wp_style_engine_get_styles( $block_styles, $options = array() ) {
	if ( ! class_exists( 'WP_Style_Engine' ) ) {
		return array();
	}
	$defaults = array(
		'selector'                   => null,
		'context'                    => 'block-supports',
		'convert_vars_to_classnames' => false,
		'enqueue'                    => false,
	);

	$style_engine  = WP_Style_Engine::get_instance();
	$options       = wp_parse_args( $options, $defaults );
	$parsed_styles = null;

	// Block supports styles.
	if ( 'block-supports' === $options['context'] ) {
		$parsed_styles = $style_engine::parse_block_styles( $block_styles, $options );
	}

	// Output.
	$styles_output = array();

	if ( ! $parsed_styles ) {
		return $styles_output;
	}

	if ( ! empty( $parsed_styles['declarations'] ) ) {
		$styles_output['css']          = $style_engine::compile_css( $parsed_styles['declarations'], $options['selector'] );
		$styles_output['declarations'] = $parsed_styles['declarations'];
		if ( true === $options['enqueue'] ) {
			$style_engine::store_css_rule( $options['context'], $options['selector'], $parsed_styles['declarations'] );
		}
	}

	if ( ! empty( $parsed_styles['classnames'] ) ) {
		$styles_output['classnames'] = implode( ' ', $parsed_styles['classnames'] );
	}

	return array_filter( $styles_output );
}

/**
 * Global public interface method to register styles to be enqueued and rendered.
 *
 * @access public
 *
 * @param string $store_key A valid store key.
 * @param array  $css_rules array(
 *     'selector'         => (string) A CSS selector.
 *     'declarations' => (boolean) An array of CSS definitions, e.g., array( "$property" => "$value" ).
 * );.
 *
 * @return WP_Style_Engine_CSS_Rules_Store|null.
 */
function wp_style_engine_add_to_store( $store_key, $css_rules = array() ) {
	if ( ! class_exists( 'WP_Style_Engine' ) || ! $store_key ) {
		return null;
	}

	// Get instance here to ensure that we register hooks to enqueue stored styles.
	$style_engine = WP_Style_Engine::get_instance();

	if ( empty( $css_rules ) ) {
		return $style_engine::get_store( $store_key );
	}

	foreach ( $css_rules as $css_rule ) {
		if ( ! isset( $css_rule['selector'], $css_rule['declarations'] ) ) {
			continue;
		}
		$style_engine::store_css_rule( $store_key, $css_rule['selector'], $css_rule['declarations'] );
	}
	return $style_engine::get_store( $store_key );
}

/**
 * Returns compiled CSS from a collection of selectors and declarations.
 * This won't add to any store, but is useful for returning a compiled style sheet from any CSS selector + declarations combos.
 *
 * @access public
 *
 * @param array $css_rules array(
 *     'selector'     => (string) A CSS selector.
 *     'declarations' => (boolean) An array of CSS definitions, e.g., array( "$property" => "$value" ).
 * );.
 *
 * @return string A compiled CSS string.
 */
function wp_style_engine_get_stylesheet_from_css_rules( $css_rules = array() ) {
	if ( ! class_exists( 'WP_Style_Engine' ) ) {
		return '';
	}

	$css_rule_objects = array();

	foreach ( $css_rules as $css_rule ) {
		if ( ! isset( $css_rule['selector'], $css_rule['declarations'] ) ) {
			continue;
		}

		if ( empty( $css_rule['declarations'] ) || ! is_array( $css_rule['declarations'] ) ) {
			continue;
		}
		$css_rule_objects[] = new WP_Style_Engine_CSS_Rule( $css_rule['selector'], $css_rule['declarations'] );
	}

	if ( empty( $css_rule_objects ) ) {
		return '';
	}

	return WP_Style_Engine::compile_stylesheet_from_css_rules( $css_rule_objects );
}
