<?php
/**
 * Webfonts API: Provider abstract class.
 *
 * Individual webfonts providers should extend this class and implement.
 *
 * @package    WordPress
 * @subpackage WebFonts
 * @since      X.X.X
 */

if ( class_exists( 'WP_Webfonts_Provider' ) ) {
	return;
}

/**
 * Abstract class for Webfonts API providers.
 *
 * The starting point to building a webfont service provider.
 *
 * What is a Provider?
 *
 * A provider contains the know-how (business logic) for how to
 * process its specific font service (i.e. local or remote)
 * and how to generate the `@font-face` styles for its service.
 *
 * It receives a collection of webfonts from the Controller
 * {@see WP_Webfonts_Provider::set_setfonts()}, and when requested
 * {@see WP_Webfonts_Provider::get_css()}, it transforms them
 * into styles (in a performant way for the provider service
 * it manages).
 *
 * @since X.X.X
 */
abstract class WP_Webfonts_Provider {

	/**
	 * The provider's unique ID.
	 *
	 * @since X.X.X
	 *
	 * @var string
	 */
	protected $id = '';

	/**
	 * Webfonts to be processed.
	 *
	 * @since X.X.X
	 *
	 * @var array[]
	 */
	protected $webfonts = array();

	/**
	 * Array of Font-face style tag's attribute(s)
	 * where the key is the attribute name and the
	 * value is its value.
	 *
	 * @since X.X.X
	 *
	 * @var string[]
	 */
	protected $style_tag_atts = array();

	/**
	 * Sets this provider's webfonts property.
	 *
	 * The API's Controller passes this provider's webfonts
	 * for processing here in the provider.
	 *
	 * @since X.X.X
	 *
	 * @param array[] $webfonts Registered webfonts.
	 */
	public function set_webfonts( array $webfonts ) {
		$this->webfonts = $webfonts;
	}

	/**
	 * Prints the generated styles.
	 *
	 * @since X.X.X
	 */
	public function print_styles() {
		printf(
			$this->get_style_element(),
			$this->get_css()
		);
	}

	/**
	 * Gets the `@font-face` CSS for the provider's webfonts.
	 *
	 * This method is where the provider does it processing to build the
	 * needed `@font-face` CSS for all of its webfonts. Specifics of how
	 * this processing is done is contained in each provider.
	 *
	 * @since X.X.X
	 *
	 * @return string The `@font-face` CSS.
	 */
	abstract public function get_css();

	/**
	 * Gets the `<style>` element for wrapping the `@font-face` CSS.
	 *
	 * @since X.X.X
	 *
	 * @return string The style element.
	 */
	protected function get_style_element() {
		$attributes = $this->generate_style_element_attributes();

		return "<style id='wp-webfonts-{$this->id}'{$attributes}>\n%s\n</style>\n";
	}

	/**
	 * Gets the defined <style> element's attributes.
	 *
	 * @since X.X.X
	 *
	 * @return string A string of attribute=value when defined, else, empty string.
	 */
	private function generate_style_element_attributes() {
		$attributes = '';
		foreach ( $this->style_tag_atts as $name => $value ) {
			$attributes .= " {$name}='{$value}'";
		}
		return $attributes;
	}
}
