<?php
/**
 * Webfonts API: Provider abstract class.
 *
 * Individual webfonts providers should extend this class and implement.
 *
 * @package    WordPress
 * @subpackage WebFonts
 * @since      5.9.0
 */

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
 * @since 5.9.0
 */
abstract class WP_Webfonts_Provider {

	/**
	 * The provider's unique ID.
	 *
	 * @since 5.9.0
	 *
	 * @var string
	 */
	protected $id;

	/**
	 * The provider's root URL.
	 *
	 * @since 5.9.0
	 *
	 * @var string
	 */
	protected $root_url = '';

	/**
	 * Webfonts to be processed.
	 *
	 * @since 5.9.0
	 *
	 * @var array[]
	 */
	protected $webfonts = array();

	/**
	 * Array of resources hints, used to render the resource `<link>` in the `<head>`.
	 *
	 * @since 5.9.0
	 *
	 * @var string[] {
	 *      Resource attributes for each relation type (e.g. 'preconnect' or 'prerender').
	 *
	 *      @type string $relation_type => array {
	 *         Array of resource attributes.
	 *
	 *         @type string $href        URL to include in resource hints. Required.
	 *         @type string $as          Optional. How the browser should treat the resource
	 *                                   (`script`, `style`, `image`, `document`, etc).
	 *         @type string $crossorigin Optional. Indicates the CORS policy of the specified resource.
	 *         @type float  $pr          Optional. Expected probability that the resource hint will be used.
	 *         @type string $type        Optional. Type of the resource (`text/html`, `text/css`, etc).
	 *     }
	 * }
	 */
	protected $resource_hints = array();

	/**
	 * Get the provider's unique ID.
	 *
	 * @since 5.9.0
	 *
	 * @return string
	 */
	public function get_id() {
		return $this->id;
	}

	/**
	 * Sets this provider's webfonts property.
	 *
	 * The API's Controller passes this provider's webfonts
	 * for processing here in the provider.
	 *
	 * @since 5.9.0
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
	 * @since 5.9.0
	 *
	 * @return string The `@font-face` CSS.
	 */
	abstract public function get_css();

	/**
	 * Gets the provider's resource hints.
	 *
	 * The Controller calls this method {@see WP_Webfonts_Controller::get_resource_hints()}
	 * when the `'wp_resource_hints'` filter fires.
	 *
	 * @since 5.9.0
	 *
	 * @return string[] Array of resource attributes.
	 *                  See {@see WP_Webfonts_Provider::$resource_hints} for
	 *                  the list of resource hints.
	 */
	public function get_resource_hints() {
		return $this->resource_hints;
	}
}
