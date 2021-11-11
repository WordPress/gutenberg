<?php
/**
 * Webfonts API: Webfonts Registry
 *
 * @package WordPress
 * @subpackage Webfonts
 * @since 5.9.0
 */

/**
 * The Webfonts Registry handles the registration of webfonts and in-memory storage
 * of the validated registered webfonts.
 *
 * Each webfont is stored in the registry by a unique key composed of its
 * font-family.font-style.font-weight.
 *
 * To optimize querying by provider ID {@see WP_Webfonts_Registry::get_by_provider()},
 * each webfont is also associated to its provider in an in-memory lookup map.
 *
 * During registration {@see WP_Webfonts_Registry::register()}, the following tasks
 * occur:
 *    * snake_case properties are converted into
 *      kebab-case (i.e. valid CSS properties).
 *    * require properties are validated
 *      {@see WP_Webfonts_Schema_Validator::is_valid_schema()}.
 *    * optional properties are set if missing, else checked and, if invalid, set to a
 *      default value {@see WP_Webfonts_Schema_Validator::set_valid_properties()}.
 *
 * @since 5.9.0
 */
class WP_Webfonts_Registry {

	/**
	 * An in-memory storage container that holds all registered webfonts
	 * for use within the API.
	 *
	 * Keyed by font-family.font-style.font-weight:
	 *
	 *      @type string $key => @type array Webfont.
	 *
	 * @since 5.9.0
	 *
	 * @var array[]
	 */
	private $registered = array();

	/**
	 * Registration keys per provider.
	 *
	 * Provides a O(1) lookup when querying by provider.
	 *
	 * @since 5.9.0
	 *
	 * @var array[]
	 */
	private $registry_by_provider = array();

	/**
	 * Schema validator.
	 *
	 * @since 5.9.0
	 *
	 * @var WP_Webfonts_Schema_Validator
	 */
	private $validator;

	/**
	 * Creates the registry.
	 *
	 * @since 5.9.0
	 *
	 * @param WP_Webfonts_Schema_Validator $validator Instance of the validator.
	 */
	public function __construct( WP_Webfonts_Schema_Validator $validator ) {
		$this->validator = $validator;
	}

	/**
	 * Gets all registered webfonts.
	 *
	 * @since 5.9.0
	 *
	 * @return array[] Registered webfonts each keyed by font-family.font-style.font-weight.
	 */
	public function get_all_registered() {
		return $this->registered;
	}

	/**
	 * Gets the registered webfonts for the given provider.
	 *
	 * @since 5.9.0
	 *
	 * @param string $provider_id Provider ID to fetch.
	 * @return array[] Registered webfonts.
	 */
	public function get_by_provider( $provider_id ) {
		if ( ! isset( $this->registry_by_provider[ $provider_id ] ) ) {
			return array();
		}

		$webfonts = array();
		foreach ( $this->registry_by_provider[ $provider_id ] as $registration_key ) {
			// Skip if not registered.
			if ( ! isset( $this->registered[ $registration_key ] ) ) {
				continue;
			}

			$webfonts[ $registration_key ] = $this->registered[ $registration_key ];
		}

		return $webfonts;
	}

	/**
	 * Registers the given webfont if its schema is valid.
	 *
	 * @since 5.9.0
	 *
	 * @param array $webfont {
	 *     Webfont definition.
	 *
	 *    @type string       $provider                The provider ID (e.g. 'local', 'google').
	 *    @type string       $font_family             The @font-face font-family property.
	 *    @type string       $font_weight             The @font-face font-weight property.
	 *                                                The font-weight can be a single value, or a range.
	 *                                                If a single value, then the font-weight can either be
	 *                                                a numeric value (400, 700, etc), or a word value
	 *                                                (normal, bold, etc).
	 *                                                If a range, then the font-weight can be a numeric range
	 *                                                using 2 values, separated by a space ('100 700').
	 *    @type string       $font_style              The @font-face font-style property.
	 *                                                The font-style can be a valid CSS value (normal, italic etc).
	 *    @type string       $font_display            The @font-face font-display property.
	 *                                                Accepted values: 'auto', 'block', 'fallback', 'swap'.
	 *    @type array|string $src                     The @font-face src property.
	 *                                                The src can be a single URL, or an array of URLs.
	 *    @type string       $font_stretch            The @font-face font-stretch property.
	 *    @type string       $font_variant            The @font-face font-variant property.
	 *    @type string       $font_feature_settings   The @font-face font-feature-settings property.
	 *    @type string       $font_variation_settings The @font-face font-variation-settings property.
	 *    @type string       $line_gap_override       The @font-face line-gap-override property.
	 *    @type string       $size_adjust             The @font-face size-adjust property.
	 *    @type string       $unicode_range           The @font-face unicode-range property.
	 *    @type string       $ascend_override         The @font-face ascend-override property.
	 *    @type string       $descend_override        The @font-face descend-override property.
	 * }
	 * @return string Registration key.
	 */
	public function register( array $webfont ) {
		$webfont = $this->convert_to_kebab_case( $webfont );

		// Validate schema.
		if ( ! $this->validator->is_valid_schema( $webfont ) ) {
			return '';
		}

		$webfont = $this->validator->set_valid_properties( $webfont );

		// Add to registry.
		$registration_key = $this->generate_registration_key( $webfont );
		if ( isset( $this->registered[ $registration_key ] ) ) {
			return $registration_key;
		}

		$this->registered[ $registration_key ] = $webfont;
		$this->store_for_query_by( $webfont, $registration_key );

		return $registration_key;
	}

	/**
	 * Convert snake_case keys into kebab-case.
	 *
	 * @since 5.9.0
	 *
	 * @param array $webfont Webfont definition.
	 * @return array Webfont with kebab-case properties (keys).
	 */
	private function convert_to_kebab_case( array $webfont ) {
		$kebab_case = array();
		foreach ( $webfont as $key => $value ) {
			$converted_key                = str_replace( '_', '-', $key );
			$kebab_case[ $converted_key ] = $value;
		}

		return $kebab_case;
	}

	/**
	 * Store the webfont for query by request.
	 *
	 * This container provides a performant way to quickly query webfonts by
	 * provider. The registration keys are stored for O(1) lookup.
	 *
	 * @since 5.9.0
	 *
	 * @param array  $webfont          Webfont definition.
	 * @param string $registration_key Webfont's registration key.
	 */
	private function store_for_query_by( array $webfont, $registration_key ) {
		$provider = $webfont['provider'];

		// Initialize the array if it does not exist.
		if ( ! isset( $this->registry_by_provider[ $provider ] ) ) {
			$this->registry_by_provider[ $provider ] = array();
		}

		$this->registry_by_provider[ $provider ][] = $registration_key;
	}

	/**
	 * Generates the registration key.
	 *
	 * Format: font-family.font-style.font-weight
	 * For example: `'open-sans.normal.400'`.
	 *
	 * @since 5.9.0
	 *
	 * @param array $webfont Webfont definition.
	 * @return string Registration key.
	 */
	private function generate_registration_key( array $webfont ) {
		return sprintf(
			'%s.%s.%s',
			$this->convert_font_family_into_key( $webfont['font-family'] ),
			trim( $webfont['font-style'] ),
			trim( $webfont['font-weight'] )
		);
	}

	/**
	 * Converts the given font family into a key.
	 *
	 * For example: 'Open Sans' becomes 'open-sans'.
	 *
	 * @since 5.9.0
	 *
	 * @param string $font_family Font family to convert into a key.
	 * @return string Font-family as a key.
	 */
	private function convert_font_family_into_key( $font_family ) {
		return sanitize_title( $font_family );
	}
}
