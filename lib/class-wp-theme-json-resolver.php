<?php
/**
 * Class that works with the managed styles.
 *
 * @package gutenberg
 */

class WP_Theme_JSON_Resolver {

	/**
	 * Container for data coming from core.
	 *
	 * @var WP_Theme_JSON
	 */
	private static $core = null;

	/**
	 * Container for data coming from the theme.
	 *
	 * @var WP_Theme_JSON
	 */
	private $theme = null;

	/**
	 * Container for data coming from the user.
	 *
	 * @var WP_Theme_JSON
	 */
	private static $user = null;

	/**
	 * Stores the ID of the custom post type
	 * that holds the user data.
	 *
	 * @var integer
	 */
	private static $user_custom_post_type_id = null;

	/**
	 * Processes a file that adheres to the theme.json
	 * schema and returns an array with its contents,
	 * or a void array if none found.
	 *
	 * @param string $file_path Path to file.
	 *
	 * @return array Contents that adhere to the theme.json schema.
	 */
	private static function get_from_file( $file_path ) {
		$config = array();
		if ( file_exists( $file_path ) ) {
			$decoded_file = json_decode(
				file_get_contents( $file_path ),
				true
			);

			$json_decoding_error = json_last_error();
			if ( JSON_ERROR_NONE !== $json_decoding_error ) {
				error_log( 'Error when decoding file schema: ' . json_last_error_msg() );
				return $config;
			}

			if ( is_array( $decoded_file ) ) {
				$config = $decoded_file;
			}
		}
		return $config;
	}

	/**
	 * Return core's origin config.
	 *
	 * @return WP_Theme_JSON Entity that holds core data.
	 */
	private static function get_core_origin() {
		if ( null !== self::$core ) {
			return self::$core;
		}

		$config = self::get_from_file( __DIR__ . '/experimental-default-theme.json' );

		// Start i18n logic to remove when JSON i18 strings are extracted.
		$default_colors_i18n = array(
			'black'                 => __( 'Black', 'gutenberg' ),
			'cyan-bluish-gray'      => __( 'Cyan bluish gray', 'gutenberg' ),
			'white'                 => __( 'White', 'gutenberg' ),
			'pale-pink'             => __( 'Pale pink', 'gutenberg' ),
			'vivid-red'             => __( 'Vivid red', 'gutenberg' ),
			'luminous-vivid-orange' => __( 'Luminous vivid orange', 'gutenberg' ),
			'luminous-vivid-amber'  => __( 'Luminous vivid amber', 'gutenberg' ),
			'light-green-cyan'      => __( 'Light green cyan', 'gutenberg' ),
			'vivid-green-cyan'      => __( 'Vivid green cyan', 'gutenberg' ),
			'pale-cyan-blue'        => __( 'Pale cyan blue', 'gutenberg' ),
			'vivid-cyan-blue'       => __( 'Vivid cyan blue', 'gutenberg' ),
			'vivid-purple'          => __( 'Vivid purple', 'gutenberg' ),
		);
		if ( ! empty( $config['global']['settings']['color']['palette'] ) ) {
			foreach ( $config['global']['settings']['color']['palette'] as &$color ) {
				$color['name'] = $default_colors_i18n[ $color['slug'] ];
			}
		}

		$default_gradients_i18n = array(
			'vivid-cyan-blue-to-vivid-purple'               => __( 'Vivid cyan blue to vivid purple', 'gutenberg' ),
			'light-green-cyan-to-vivid-green-cyan'          => __( 'Light green cyan to vivid green cyan', 'gutenberg' ),
			'luminous-vivid-amber-to-luminous-vivid-orange' => __( 'Luminous vivid amber to luminous vivid orange', 'gutenberg' ),
			'luminous-vivid-orange-to-vivid-red'            => __( 'Luminous vivid orange to vivid red', 'gutenberg' ),
			'very-light-gray-to-cyan-bluish-gray'           => __( 'Very light gray to cyan bluish gray', 'gutenberg' ),
			'cool-to-warm-spectrum'                         => __( 'Cool to warm spectrum', 'gutenberg' ),
			'blush-light-purple'                            => __( 'Blush light purple', 'gutenberg' ),
			'blush-bordeaux'                                => __( 'Blush bordeaux', 'gutenberg' ),
			'luminous-dusk'                                 => __( 'Luminous dusk', 'gutenberg' ),
			'pale-ocean'                                    => __( 'Pale ocean', 'gutenberg' ),
			'electric-grass'                                => __( 'Electric grass', 'gutenberg' ),
			'midnight'                                      => __( 'Midnight', 'gutenberg' ),
		);
		if ( ! empty( $config['global']['settings']['color']['gradients'] ) ) {
			foreach ( $config['global']['settings']['color']['gradients'] as &$gradient ) {
				$gradient['name'] = $default_gradients_i18n[ $gradient['slug'] ];
			}
		}

		$default_font_sizes_i18n = array(
			'small'  => __( 'Small', 'gutenberg' ),
			'normal' => __( 'Normal', 'gutenberg' ),
			'medium' => __( 'Medium', 'gutenberg' ),
			'large'  => __( 'Large', 'gutenberg' ),
			'huge'   => __( 'Huge', 'gutenberg' ),
		);
		if ( ! empty( $config['global']['settings']['typography']['fontSizes'] ) ) {
			foreach ( $config['global']['settings']['typography']['fontSizes'] as &$font_size ) {
				$font_size['name'] = $default_font_sizes_i18n[ $font_size['slug'] ];
			}
		}

		$default_font_styles_i18n = array(
			'normal'  => __( 'Regular', 'gutenberg' ),
			'italic'  => __( 'Italic', 'gutenberg' ),
			'initial' => __( 'Initial', 'gutenberg' ),
			'inherit' => __( 'Inherit', 'gutenberg' ),
		);
		if ( ! empty( $config['global']['settings']['typography']['fontStyles'] ) ) {
			foreach ( $config['global']['settings']['typography']['fontStyles'] as &$font_style ) {
				$font_style['name'] = $default_font_styles_i18n[ $font_style['slug'] ];
			}
		}

		$default_font_weights_i18n = array(
			'100'     => __( 'Ultralight', 'gutenberg' ),
			'200'     => __( 'Thin', 'gutenberg' ),
			'300'     => __( 'Light', 'gutenberg' ),
			'400'     => __( 'Regular', 'gutenberg' ),
			'500'     => __( 'Medium', 'gutenberg' ),
			'600'     => __( 'Semibold', 'gutenberg' ),
			'700'     => __( 'Bold', 'gutenberg' ),
			'800'     => __( 'Heavy', 'gutenberg' ),
			'900'     => __( 'Black', 'gutenberg' ),
			'initial' => __( 'Initial', 'gutenberg' ),
			'inherit' => __( 'Inherit', 'gutenberg' ),
		);
		if ( ! empty( $config['global']['settings']['typography']['fontWeights'] ) ) {
			foreach ( $config['global']['settings']['typography']['fontWeights'] as &$font_weight ) {
				$font_weight['name'] = $default_font_weights_i18n[ $font_weight['slug'] ];
			}
		}
		// End i18n logic to remove when JSON i18 strings are extracted.

		self::$core = new WP_Theme_JSON( $config );

		return self::$core;
	}

	/**
	 * Extracts the legacy theme settings and reorganizes them
	 * into a structue that adheres to the theme.json schema.
	 *
	 * @param array $settings Existing editor settings.
	 *
	 * @return array Config that adheres to the theme.json schema.
	 */
	public static function extract_legacy_settings( $settings ) {
		$theme_settings                       = array();
		$theme_settings['global']             = array();
		$theme_settings['global']['settings'] = array();

		// Deprecated theme supports.
		if ( isset( $settings['disableCustomColors'] ) ) {
			if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
				$theme_settings['global']['settings']['color'] = array();
			}
			$theme_settings['global']['settings']['color']['custom'] = ! $settings['disableCustomColors'];
		}

		if ( isset( $settings['disableCustomGradients'] ) ) {
			if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
				$theme_settings['global']['settings']['color'] = array();
			}
			$theme_settings['global']['settings']['color']['customGradient'] = ! $settings['disableCustomGradients'];
		}

		if ( isset( $settings['disableCustomFontSizes'] ) ) {
			if ( ! isset( $theme_settings['global']['settings']['typography'] ) ) {
				$theme_settings['global']['settings']['typography'] = array();
			}
			$theme_settings['global']['settings']['typography']['customFontSize'] = ! $settings['disableCustomFontSizes'];
		}

		if ( isset( $settings['enableCustomLineHeight'] ) ) {
			if ( ! isset( $theme_settings['global']['settings']['typography'] ) ) {
				$theme_settings['global']['settings']['typography'] = array();
			}
			$theme_settings['global']['settings']['typography']['customLineHeight'] = $settings['enableCustomLineHeight'];
		}

		if ( isset( $settings['enableCustomUnits'] ) ) {
			if ( ! isset( $theme_settings['global']['settings']['spacing'] ) ) {
				$theme_settings['global']['settings']['spacing'] = array();
			}
			$theme_settings['global']['settings']['spacing']['units'] = ( true === $settings['enableCustomUnits'] ) ?
				array( 'px', 'em', 'rem', 'vh', 'vw' ) :
				$settings['enableCustomUnits'];
		}

		if ( isset( $settings['colors'] ) ) {
			if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
				$theme_settings['global']['settings']['color'] = array();
			}
			$theme_settings['global']['settings']['color']['palette'] = $settings['colors'];
		}

		if ( isset( $settings['gradients'] ) ) {
			if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
				$theme_settings['global']['settings']['color'] = array();
			}
			$theme_settings['global']['settings']['color']['gradients'] = $settings['gradients'];
		}

		if ( isset( $settings['fontSizes'] ) ) {
			$font_sizes = $settings['fontSizes'];
			// Back-compatibility for presets without units.
			foreach ( $font_sizes as &$font_size ) {
				if ( is_numeric( $font_size['size'] ) ) {
					$font_size['size'] = $font_size['size'] . 'px';
				}
			}
			if ( ! isset( $theme_settings['global']['settings']['typography'] ) ) {
				$theme_settings['global']['settings']['typography'] = array();
			}
			$theme_settings['global']['settings']['typography']['fontSizes'] = $font_sizes;
		}

		// Things that didn't land in core yet, so didn't have a setting assigned.
		if ( current( (array) get_theme_support( 'custom-spacing' ) ) ) {
			if ( ! isset( $theme_settings['global']['settings']['spacing'] ) ) {
				$theme_settings['global']['settings']['spacing'] = array();
			}
			$theme_settings['global']['settings']['spacing']['customPadding'] = true;
		}

		if ( current( (array) get_theme_support( 'experimental-link-color' ) ) ) {
			if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
				$theme_settings['global']['settings']['color'] = array();
			}
			$theme_settings['global']['settings']['color']['link'] = true;
		}

		return $theme_settings;
	}

	/**
	 * Returns the theme's origin config.
	 *
	 * It also fetches the existing presets the theme
	 * may have declared via add_theme_support and
	 * uses them if the theme hasn't declared any via theme.json.
	 *
	 * @param array $settings Existing editor settings.
	 *
	 * @return WP_Theme_JSON Entity that holds theme data.
	 */
	private function get_theme_origin( $settings ) {
		$theme_support_data = self::extract_legacy_settings( $settings );
		$theme_json_data    = self::get_from_file( locate_template( 'experimental-theme.json' ) );

		/*
		 * We want the presets and settings declared in theme.json
		 * to override the ones declared via add_theme_support.
		 */
		$this->theme = new WP_Theme_JSON( $theme_support_data );
		$this->theme->merge( new WP_Theme_JSON( $theme_json_data ) );

		return $this->theme;
	}

	/**
	 * Returns the CPT that contains the user's origin config
	 * for the current theme or a void array if none found.
	 *
	 * It can also create and return a new draft CPT.
	 *
	 * @param bool  $should_create_cpt Whether a new CPT should be created if no one was found.
	 *                                 False by default.
	 * @param array $post_status_filter Filter CPT by post status.
	 *                                  ['publish'] by default, so it only fetches published posts.
	 *
	 * @return array Custom Post Type for the user's origin config.
	 */
	private static function get_user_data_from_custom_post_type( $should_create_cpt = false, $post_status_filter = array( 'publish' ) ) {
		$user_cpt         = array();
		$post_type_filter = 'wp_global_styles';
		$post_name_filter = 'wp-global-styles-' . urlencode( wp_get_theme()->get_stylesheet() );
		$recent_posts     = wp_get_recent_posts(
			array(
				'numberposts' => 1,
				'orderby'     => 'date',
				'order'       => 'desc',
				'post_type'   => $post_type_filter,
				'post_status' => $post_status_filter,
				'name'        => $post_name_filter,
			)
		);

		if ( is_array( $recent_posts ) && ( count( $recent_posts ) === 1 ) ) {
			$user_cpt = $recent_posts[0];
		} elseif ( $should_create_cpt ) {
			$cpt_post_id = wp_insert_post(
				array(
					'post_content' => '{}',
					'post_status'  => 'publish',
					'post_type'    => $post_type_filter,
					'post_name'    => $post_name_filter,
				),
				true
			);
			$user_cpt    = get_post( $cpt_post_id, ARRAY_A );
		}

		return $user_cpt;
	}

	/**
	 * Returns the user's origin config.
	 *
	 * @return WP_Theme_JSON Entity that holds user data.
	 */
	private static function get_user_origin() {
		if ( null !== self::$user ) {
			return self::$user;
		}

		$config   = array();
		$user_cpt = self::get_user_data_from_custom_post_type();
		if ( array_key_exists( 'post_content', $user_cpt ) ) {
			$decoded_data = json_decode( $user_cpt['post_content'], true );

			$json_decoding_error = json_last_error();
			if ( JSON_ERROR_NONE !== $json_decoding_error ) {
				error_log( 'Error when decoding user schema: ' . json_last_error_msg() );
				return $config;
			}

			if ( is_array( $decoded_data ) ) {
				$config = $decoded_data;
			}
		}
		self::$user = new WP_Theme_JSON( $config );

		return self::$user;
	}

	/**
	 * There are three sources of data for a site:
	 * core, theme, and user.
	 *
	 * The main function of the resolver is to
	 * merge all this data following this algorithm:
	 * theme overrides core, and user overrides
	 * data coming from either theme or core.
	 *
	 * user data > theme data > core data
	 *
	 * The main use case for the resolver is to return
	 * the merged data up to the user level.However,
	 * there are situations in which we need the
	 * data merged up to a different level (theme)
	 * or no merged at all.
	 *
	 * @param array $settings Existing block editor settings.
	 *                        Empty array by default.
	 * @param string $origin The source of data the consumer wants.
	 *                       Valid values are 'core', 'theme', 'user'.
	 *                       Default is 'user'.
	 * @param boolean $merged Whether the data should be merged
	 *                        with the previous origins (the default).
	 *
	 * @return WP_Theme_JSON
	 */
	public function get_origin( $settings = [], $origin = 'user', $merged = true ) {

		if ( ( 'user' === $origin ) && $merged ) {
			$result = new WP_Theme_JSON();
			$result->merge( self::get_core_origin() );
			$result->merge( $this->get_theme_origin( $settings ) );
			$result->merge( self::get_user_origin() );
			return $result;
		}

		if ( ( 'theme' === $origin ) && $merged ) {
			$result = new WP_Theme_JSON();
			$result->merge( self::get_core_origin() );
			$result->merge( $this->get_theme_origin( $settings ) );
			return $result;
		}

		if ( 'user' === $origin ) {
			return self::get_user_origin();
		}

		if ( 'theme' === $origin ) {
			return $this->get_theme_origin( $settings );
		}

		return self::get_core_origin();
	}

	/**
	 * Registers a Custom Post Type to store the user's origin config.
	 */
	public static function register_user_custom_post_type() {
		if ( ! gutenberg_experimental_global_styles_has_theme_json_support() ) {
			return;
		}

		$args = array(
			'label'        => __( 'Global Styles', 'gutenberg' ),
			'description'  => 'CPT to store user design tokens',
			'public'       => false,
			'show_ui'      => false,
			'show_in_rest' => true,
			'rest_base'    => '__experimental/global-styles',
			'capabilities' => array(
				'read'                   => 'edit_theme_options',
				'create_posts'           => 'edit_theme_options',
				'edit_posts'             => 'edit_theme_options',
				'edit_published_posts'   => 'edit_theme_options',
				'delete_published_posts' => 'edit_theme_options',
				'edit_others_posts'      => 'edit_theme_options',
				'delete_others_posts'    => 'edit_theme_options',
			),
			'map_meta_cap' => true,
			'supports'     => array(
				'editor',
				'revisions',
			),
		);
		register_post_type( 'wp_global_styles', $args );
	}

	/**
	 * Returns the ID of the custom post type
	 * that stores user data.
	 *
	 * @return integer
	 */
	public static function get_user_custom_post_type_id() {
		if ( null !== self::$user_custom_post_type_id ) {
			return self::$user_custom_post_type_id;
		}

		$user_cpt    = self::get_user_data_from_custom_post_type( true );
		if ( array_key_exists( 'ID', $user_cpt ) ) {
			self::$user_custom_post_type_id = $user_cpt['ID'];
		}

		return self::$user_custom_post_type_id;
	}

}
