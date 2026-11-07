<?php
/**
 * Font Providers: WP_Font_Provider_Registry class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Font_Provider_Registry' ) ) {

	/**
	 * Core class used for managing font providers.
	 *
	 * A font provider is an active extension that supplies font faces to the site
	 * while it is active: for example a plugin that adds a script fallback, an emoji
	 * font, or an icon font. The Font Library lists these faces under the provider,
	 * read-only, and they are printed with the other `@font-face` rules.
	 *
	 * Registering a provider does not add its families to the Typography settings,
	 * so they do not become choices in the font family pickers.
	 *
	 * This is not the Fonts API provider removed from Gutenberg (see #51769 and
	 * #82813), which selected how font files were delivered (local or remote).
	 */
	class WP_Font_Provider_Registry {
		/**
		 * Registered font providers, keyed by slug.
		 *
		 * @var array[]
		 */
		protected $registered_providers = array();

		/**
		 * Container for the main instance of the class.
		 *
		 * @var WP_Font_Provider_Registry|null
		 */
		protected static $instance = null;

		/**
		 * Registers a font provider.
		 *
		 * @param string $slug Font provider slug.
		 * @param array  $args {
		 *     Font provider properties.
		 *
		 *     @type string  $label        Required. A human-readable label for the provider.
		 *     @type string  $description  Optional. A human-readable description.
		 *     @type array[] $fontFamilies Required. Font family definitions in the
		 *                                 `settings.typography.fontFamilies` format of
		 *                                 theme.json. Each family needs `name`, `slug`,
		 *                                 `fontFamily` and a non-empty `fontFace` list,
		 *                                 and each face needs `fontFamily` and `src`, as
		 *                                 in theme.json. Face `src` values must be URLs.
		 * }
		 * @return bool True if the provider was registered, false otherwise.
		 */
		public function register( $slug, $args ) {
			if ( ! is_string( $slug ) || ! preg_match( '/^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/', $slug ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Font provider slug must start and end with a lowercase letter or digit and contain only lowercase letters, digits, hyphens, and underscores.', 'gutenberg' ),
					'7.2.0'
				);
				return false;
			}

			if ( $this->is_registered( $slug ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: %s: Font provider slug. */
						__( 'Font provider "%s" is already registered.', 'gutenberg' ),
						$slug
					),
					'7.2.0'
				);
				return false;
			}

			if ( ! is_array( $args ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Font provider properties must be an array.', 'gutenberg' ),
					'7.2.0'
				);
				return false;
			}

			$allowed_keys = array( 'label', 'description', 'fontFamilies' );
			foreach ( array_keys( $args ) as $key ) {
				if ( ! in_array( $key, $allowed_keys, true ) ) {
					_doing_it_wrong(
						__METHOD__,
						sprintf(
							/* translators: %s: The name of a user-provided key. */
							__( 'Invalid font provider property: "%s".', 'gutenberg' ),
							$key
						),
						'7.2.0'
					);
					return false;
				}
			}

			if ( empty( $args['label'] ) || ! is_string( $args['label'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Font provider label must be a non-empty string.', 'gutenberg' ),
					'7.2.0'
				);
				return false;
			}

			if ( isset( $args['description'] ) && ! is_string( $args['description'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Font provider description must be a string.', 'gutenberg' ),
					'7.2.0'
				);
				return false;
			}

			if ( empty( $args['fontFamilies'] ) || ! wp_is_numeric_array( $args['fontFamilies'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Font provider fontFamilies must be a non-empty list of font families.', 'gutenberg' ),
					'7.2.0'
				);
				return false;
			}

			$slugs = array();
			foreach ( $args['fontFamilies'] as $family ) {
				if ( ! $this->is_valid_font_family( $family ) ) {
					_doing_it_wrong(
						__METHOD__,
						__( 'Each font provider family needs a string name, slug and fontFamily, and a non-empty fontFace list whose faces each have a fontFamily and a src.', 'gutenberg' ),
						'7.2.0'
					);
					return false;
				}
				if ( isset( $slugs[ $family['slug'] ] ) ) {
					_doing_it_wrong(
						__METHOD__,
						sprintf(
							/* translators: %s: Font family slug. */
							__( 'Font family slug "%s" is used twice in one font provider.', 'gutenberg' ),
							$family['slug']
						),
						'7.2.0'
					);
					return false;
				}
				$slugs[ $family['slug'] ] = true;
			}

			$font_families = array();
			foreach ( $args['fontFamilies'] as $family ) {
				$font_families[] = $this->normalize_font_family( $family );
			}

			$this->registered_providers[ $slug ] = array(
				'slug'         => $slug,
				'label'        => $args['label'],
				'description'  => $args['description'] ?? '',
				'fontFamilies' => $font_families,
			);

			return true;
		}

		/**
		 * Checks the shape of one font family definition.
		 *
		 * @param mixed $family Font family definition.
		 * @return bool Whether the definition can be listed and printed.
		 */
		protected function is_valid_font_family( $family ) {
			if ( ! is_array( $family ) ) {
				return false;
			}

			foreach ( array( 'name', 'slug', 'fontFamily' ) as $key ) {
				if ( empty( $family[ $key ] ) || ! is_string( $family[ $key ] ) ) {
					return false;
				}
			}

			if ( empty( $family['fontFace'] ) || ! wp_is_numeric_array( $family['fontFace'] ) ) {
				return false;
			}

			foreach ( $family['fontFace'] as $face ) {
				if ( ! is_array( $face ) || empty( $face['src'] ) ) {
					return false;
				}
				if ( empty( $face['fontFamily'] ) || ! is_string( $face['fontFamily'] ) ) {
					return false;
				}
				if ( ! is_string( $face['src'] ) && ! wp_is_numeric_array( $face['src'] ) ) {
					return false;
				}
			}

			return true;
		}

		/**
		 * Fills the face properties that have a CSS default.
		 *
		 * A missing `fontStyle` or `fontWeight` takes the value WP_Font_Face prints by
		 * default, so the face listed in the Font Library matches the printed rule. The
		 * face `fontFamily` is required rather than derived from the family stack: a
		 * family name may itself contain a comma.
		 *
		 * @param array $family Valid font family definition.
		 * @return array Font family definition with complete faces.
		 */
		protected function normalize_font_family( $family ) {
			foreach ( $family['fontFace'] as $index => $face ) {
				if ( empty( $face['fontStyle'] ) ) {
					$face['fontStyle'] = 'normal';
				}
				if ( empty( $face['fontWeight'] ) ) {
					$face['fontWeight'] = '400';
				}
				$family['fontFace'][ $index ] = $face;
			}
			$family['fontFace'] = array_values( $family['fontFace'] );

			return $family;
		}

		/**
		 * Unregisters a font provider.
		 *
		 * @param string $slug Font provider slug.
		 * @return bool True if the provider was unregistered, false otherwise.
		 */
		public function unregister( $slug ) {
			if ( ! $this->is_registered( $slug ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: %s: Font provider slug. */
						__( 'Font provider "%s" not found.', 'gutenberg' ),
						$slug
					),
					'7.2.0'
				);
				return false;
			}

			unset( $this->registered_providers[ $slug ] );

			return true;
		}

		/**
		 * Retrieves a registered font provider.
		 *
		 * @param string $slug Font provider slug.
		 * @return array|null The provider, or null if it is not registered.
		 */
		public function get_registered( $slug ) {
			return $this->is_registered( $slug ) ? $this->registered_providers[ $slug ] : null;
		}

		/**
		 * Retrieves all registered font providers.
		 *
		 * @return array[] Registered font providers.
		 */
		public function get_all_registered() {
			return array_values( $this->registered_providers );
		}

		/**
		 * Checks if a font provider is registered.
		 *
		 * @param string|null $slug Font provider slug.
		 * @return bool Whether the provider is registered.
		 */
		public function is_registered( $slug ) {
			return isset( $slug, $this->registered_providers[ $slug ] );
		}

		/**
		 * Returns the font faces of all providers in the format of wp_print_font_faces().
		 *
		 * Unlike theme.json presets, each face keeps its own `fontFamily`, so a
		 * provider can ship a face whose family name differs from the name of the
		 * family it is listed under.
		 *
		 * @return array[][] Font faces grouped by family, with kebab-case properties.
		 */
		public function get_font_faces() {
			$fonts = array();

			foreach ( $this->registered_providers as $provider ) {
				foreach ( $provider['fontFamilies'] as $family ) {
					$faces = array();

					foreach ( $family['fontFace'] as $face ) {
						$converted = array();
						foreach ( $face as $key => $value ) {
							$converted[ _wp_to_kebab_case( $key ) ] = $value;
						}
						$faces[] = $converted;
					}

					$fonts[] = $faces;
				}
			}

			return $fonts;
		}

		/**
		 * Utility method to retrieve the main instance of the class.
		 *
		 * @return WP_Font_Provider_Registry The main instance.
		 */
		public static function get_instance() {
			if ( null === self::$instance ) {
				self::$instance = new self();
			}

			return self::$instance;
		}
	}
}
