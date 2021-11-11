<?php
/**
 * Webfonts API: Provider Registry
 *
 * @package WordPress
 * @subpackage Webfonts
 * @since 5.9.0
 */

/**
 * The Providers Registry handles the registration
 * of core providers, registration of custom providers,
 * instantiation of each provider, and in-memory storage
 * of the registered providers. Each provider is stored
 * in the registry by its unique ID, such as 'local', along
 * with an instance of the provider (object).
 *
 * Each provider contains the business logic for how to
 * process its specific font service (i.e. local or remote)
 * and how to generate the `@font-face` styles for its service.
 *
 * This registry is for collecting those providers for
 * use within the API.
 *
 * @since 5.9.0
 */
class WP_Webfonts_Provider_Registry {

	/**
	 * An in-memory storage container that holds all registered providers
	 * for use within the API.
	 *
	 * Keyed by the respective provider's unique provider ID:
	 *
	 *      @type string $provider_id => @type WP_Webfonts_Provider Provider instance.
	 *
	 * @since 5.9.0
	 *
	 * @var WP_Webfonts_Provider[]
	 */
	private $registered = array();

	/**
	 * Gets all registered providers.
	 *
	 * Return an array of providers, each keyed by their unique
	 * ID (i.e. the `$id` property in the provider's object) with
	 * an instance of the provider (object):
	 *     ID => provider instance
	 *
	 * @since 5.9.0
	 *
	 * @return WP_Webfonts_Provider[] All registered providers,
	 *                                each keyed by their unique ID.
	 */
	public function get_all_registered() {
		return $this->registered;
	}

	/**
	 * Initializes the registry.
	 *
	 * @since 5.9.0
	 */
	public function init() {
		$this->register_core_providers();
	}

	/**
	 * Registers the core providers.
	 *
	 * Loads each bundled provider's file into memory and
	 * then registers it for use with the API.
	 *
	 * @since 5.9.0
	 */
	private function register_core_providers() {
		// Load the abstract class into memory.
		require_once __DIR__ . '/providers/class-wp-webfonts-provider.php';

		// Register the Google Provider.
		require_once __DIR__ . '/providers/class-wp-webfonts-google-provider.php';
		$this->register( WP_Webfonts_Google_Provider::class );

		// Register the Local Provider.
		require_once __DIR__ . '/providers/class-wp-webfonts-local-provider.php';
		$this->register( WP_Webfonts_Local_Provider::class );
	}

	/**
	 * Registers a webfont provider.
	 *
	 * The provider will be registered by its unique ID
	 * (via `WP_Webfonts_Provider::get_id()`) and instance of
	 * the provider (object):
	 *     ID => provider instance
	 *
	 * Once registered, provider is ready for use within the API.
	 *
	 * @since 5.9.0
	 *
	 * @param string $classname The provider's class name.
	 *                          The class should be a child of `WP_Webfonts_Provider`.
	 *                          See {@see WP_Webfonts_Provider}.
	 *
	 * @return bool True when registered. False when provider does not exist.
	 */
	public function register( $classname ) {
		/*
		 * Bail out if the class does not exist in memory (its file
		 * has to be loaded into memory before registration) or the
		 * `class` itself is not a child that extends `WP_Webfonts_Provider`
		 * (the parent class of a provider).
		 */
		if (
			! class_exists( $classname ) ||
			! is_subclass_of( $classname, 'WP_Webfonts_Provider' )
		) {
			return false;
		}

		/*
		 * Create an instance of the provider.
		 * This API uses one instance of each provider.
		 */
		$provider = new $classname;
		$id       = $provider->get_id();

		// Store the provider's instance by its unique provider ID.
		if ( ! isset( $this->registered[ $id ] ) ) {
			$this->registered[ $id ] = $provider;
		}

		return true;
	}
}
