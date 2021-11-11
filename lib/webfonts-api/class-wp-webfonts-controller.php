<?php
/**
 * Webfonts API: Webfonts Controller
 *
 * @package WordPress
 * @subpackage Webfonts
 * @since 5.9.0
 */

/**
 * Webfonts Controller exposes the public entry point into this API
 * and coordinates the interactions between the webfonts registry,
 * providers registry, and the Dependencies API.
 *
 *                   event
 *                    ↕
 *                Controller
 *         ⤢                    ⤡
 *  Webfonts Registry     Providers Registry
 *       ↕                ⤢           ⤡         .. [custom providers]
 *  Validator         Local        Google Fonts
 *                    Provider     Provider
 *                      ↕             ↕
 *                    Filesystem   Remote Font API Service
 *
 * The Controller receives an event such as a request to register
 * a webfont or provider, print `@font-face` styles in the `<head>`
 * (e.g. `'wp_enqueue_scripts'`), or print the resource `<link>`
 * (`'wp_resource_hints'` ). Then it interacts with the components
 * in this API to process the event.
 *
 * @since 5.9.0
 */
class WP_Webfonts_Controller {

	/**
	 * Instance of the webfont's registry.
	 *
	 * @since 5.9.0
	 *
	 * @var WP_Webfonts_Registry
	 */
	private $webfonts_registry;

	/**
	 * Instance of the providers' registry.
	 *
	 * @since 5.9.0
	 *
	 * @var WP_Webfonts_Provider_Registry
	 */
	private $providers_registry;

	/**
	 * Stylesheet handle.
	 *
	 * @since 5.9.0
	 *
	 * @var string
	 */
	private $stylesheet_handle = '';

	/**
	 * Create the controller.
	 *
	 * @since 5.9.0
	 *
	 * @param WP_Webfonts_Registry          $webfonts_registry  Instance of the webfonts' registry.
	 * @param WP_Webfonts_Provider_Registry $providers_registry Instance of the providers' registry.
	 */
	public function __construct(
		WP_Webfonts_Registry $webfonts_registry,
		WP_Webfonts_Provider_Registry $providers_registry
	) {
		$this->webfonts_registry  = $webfonts_registry;
		$this->providers_registry = $providers_registry;
	}

	/**
	 * Initializes the controller.
	 *
	 * @since 5.9.0
	 */
	public function init() {
		$this->providers_registry->init();

		// Register callback to generate and enqueue styles.
		if ( did_action( 'wp_enqueue_scripts' ) ) {
			$this->stylesheet_handle = 'webfonts-footer';
			$hook                    = 'wp_print_footer_scripts';
		} else {
			$this->stylesheet_handle = 'webfonts';
			$hook                    = 'wp_enqueue_scripts';
		}
		add_action( $hook, array( $this, 'generate_and_enqueue_styles' ) );

		// Enqueue webfonts in the block editor.
		add_action( 'admin_init', array( $this, 'generate_and_enqueue_editor_styles' ) );

		// Add resources hints.
		add_filter( 'wp_resource_hints', array( $this, 'get_resource_hints' ), 10, 2 );
	}

	/**
	 * Gets the instance of the webfonts' registry.
	 *
	 * The Webfonts Registry handles the registration
	 * and in-memory storage of webfonts.
	 *
	 * @since 5.9.0
	 *
	 * @return WP_Webfonts_Registry
	 */
	public function webfonts() {
		return $this->webfonts_registry;
	}

	/**
	 * Gets the instance of the providers' registry.
	 *
	 * @see WP_Webfonts_Provider_Registry for more information
	 * on the available methods for use.
	 *
	 * @since 5.9.0
	 *
	 * @return WP_Webfonts_Provider_Registry
	 */
	public function providers() {
		return $this->providers_registry;
	}

	/**
	 * Generate and enqueue webfonts styles.
	 *
	 * @since 5.9.0
	 */
	public function generate_and_enqueue_styles() {
		// Generate the styles.
		$styles = $this->generate_styles();

		// Bail out if there are no styles to enqueue.
		if ( '' === $styles ) {
			return;
		}

		// Enqueue the stylesheet.
		wp_register_style( $this->stylesheet_handle, '' );
		wp_enqueue_style( $this->stylesheet_handle );

		// Add the styles to the stylesheet.
		wp_add_inline_style( $this->stylesheet_handle, $styles );
	}

	/**
	 * Generate and enqueue editor styles.
	 *
	 * @since 5.9.0
	 */
	public function generate_and_enqueue_editor_styles() {
		// Generate the styles.
		$styles = $this->generate_styles();

		// Bail out if there are no styles to enqueue.
		if ( '' === $styles ) {
			return;
		}

		wp_add_inline_style( 'wp-block-library', $styles );
	}

	/**
	 * Generate styles for webfonts.
	 *
	 * By default (due to privacy concerns), this API will not do remote requests to
	 * external webfont services nor generate `@font-face` styles for these remote
	 * providers. The filter `'has_remote_webfonts_request_permission'` is provided
	 * to grant permission to do the remote request.
	 *
	 * @since 5.9.0
	 *
	 * @return string $styles Generated styles.
	 */
	private function generate_styles() {
		$styles    = '';
		$providers = $this->providers_registry->get_all_registered();

		/*
		 * Loop through each of the providers to get the CSS for their respective webfonts
		 * to incrementally generate the collective styles for all of them.
		 */
		foreach ( $providers as $provider_id => $provider ) {
			$registered_webfonts = $this->webfonts_registry->get_by_provider( $provider_id );

			// If there are no registered webfonts for this provider, skip it.
			if ( empty( $registered_webfonts ) ) {
				continue;
			}

			/*
			 * Skip fetching from a remote fonts service if the user has not
			 * consented to the remote request.
			 */
			if (
				'local' !== $provider_id &&
				/**
				 * Allows permission to be set for doing remote requests
				 * to a webfont service provider.
				 *
				 * By default, the Webfonts API will not make remote requests
				 * due to privacy concerns.
				 *
				 * @since 5.9.0
				 *
				 * @param bool  $has_permission Permission to do the remote request.
				 *                              Default false.
				 * @param string $provider_id   Provider's ID, e.g. 'google', to identify
				 *                              the remote webfonts service provider.
				 */
				true !== apply_filters( 'has_remote_webfonts_request_permission', false, $provider_id )
			) {
				continue;
			}

			/*
			 * Process the webfonts by first passing them to the provider via `set_webfonts()`
			 * and then getting the CSS from the provider.
			 */
			$provider->set_webfonts( $registered_webfonts );
			$styles .= $provider->get_css();
		}

		return $styles;
	}

	/**
	 * Gets the resource hints.
	 *
	 * Callback hooked to the filter `'wp_resource_hints'`. Generation
	 * and rendering of the resource `<link>` is handled where that filter
	 * fires. This method adds the resource link attributes to pass back
	 * to that handler.
	 *
	 * @since 5.9.0
	 *
	 * @param array  $urls {
	 *     Array of resources and their attributes, or URLs to print for resource hints.
	 *
	 *     @type array|string ...$0 {
	 *         Array of resource attributes, or a URL string.
	 *
	 *         @type string $href        URL to include in resource hints. Required.
	 *         @type string $as          How the browser should treat the resource
	 *                                   (`script`, `style`, `image`, `document`, etc).
	 *         @type string $crossorigin Indicates the CORS policy of the specified resource.
	 *         @type float  $pr          Expected probability that the resource hint will be used.
	 *         @type string $type        Type of the resource (`text/html`, `text/css`, etc).
	 *     }
	 * }
	 * @param string $relation_type The relation type the URLs are printed for,
	 *                              e.g. 'preconnect' or 'prerender'.
	 * @return array URLs to print for resource hints.
	 */
	public function get_resource_hints( $urls, $relation_type ) {
		foreach ( $this->providers_registry->get_all_registered() as $provider ) {
			foreach ( $provider->get_resource_hints() as $relation => $relation_hints ) {
				if ( $relation !== $relation_type ) {
					continue;
				}
				// Append this provider's resource hints to the end of the given `$urls` array.
				array_push( $urls, ...$relation_hints );
			}
		}

		return $urls;
	}
}
