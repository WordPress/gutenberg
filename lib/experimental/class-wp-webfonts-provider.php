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
	 * Webfonts to be processed.
	 *
	 * @since X.X.X
	 *
	 * @var array[]
	 */
	protected $webfonts = array();

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
	 * Prints the generated styles.
	 *
	 * @since X.X.X
	 */
	public function print_styles() {
		echo $this->get_css();
	}
}
