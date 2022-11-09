<?php
/**
 * WP_Theme_JSON_Resolver_6_1 class
 *
 * @package gutenberg
 */

/**
 * Class that abstracts the processing of the different data sources
 * for site-level config and offers an API to work with them.
 *
 * This class is for internal core usage and is not supposed to be used by extenders (plugins and/or themes).
 * This is a low-level API that may need to do breaking changes. Please,
 * use get_global_settings, get_global_styles, and get_global_stylesheet instead.
 *
 * @access private
 */
class WP_Theme_JSON_Resolver_6_1 extends WP_Theme_JSON_Resolver_6_0 {

	/**
	 * Container for data coming from core.
	 *
	 * @since 5.8.0
	 * @var WP_Theme_JSON
	 */
	protected static $core = null;

	/**
	 * Given a theme.json structure modifies it in place
	 * to update certain values by its translated strings
	 * according to the language set by the user.
	 *
	 * @param array  $theme_json The theme.json to translate.
	 * @param string $domain     Optional. Text domain. Unique identifier for retrieving translated strings.
	 *                           Default 'default'.
	 * @return array Returns the modified $theme_json_structure.
	 */
	protected static function translate( $theme_json, $domain = 'default' ) {
		if ( null === static::$i18n_schema ) {
			$i18n_schema         = wp_json_file_decode( __DIR__ . '/theme-i18n.json' );
			static::$i18n_schema = null === $i18n_schema ? array() : $i18n_schema;
		}

		return translate_settings_using_i18n_schema( static::$i18n_schema, $theme_json, $domain );
	}

	/**
	 * Return core's origin config.
	 *
	 * @return WP_Theme_JSON_Gutenberg Entity that holds core data.
	 */
	public static function get_core_data() {
		if ( null !== static::$core ) {
			return static::$core;
		}

		$config = static::read_json_file( __DIR__ . '/theme.json' );
		$config = static::translate( $config );
		/**
		 * Filters the default data provided by WordPress for global styles & settings.
		 *
		 * @param WP_Theme_JSON_Data_Gutenberg Class to access and update the underlying data.
		 */
		$theme_json   = apply_filters( 'wp_theme_json_data_default', new WP_Theme_JSON_Data_Gutenberg( $config, 'default' ) );
		$config       = $theme_json->get_data();
		static::$core = new WP_Theme_JSON_Gutenberg( $config, 'default' );

		return static::$core;
	}

	/**
	 * Returns the user's origin config.
	 *
	 * @return WP_Theme_JSON_Gutenberg Entity that holds styles for user data.
	 */
	public static function get_user_data() {
		if ( null !== static::$user ) {
			return static::$user;
		}

		$config   = array();
		$user_cpt = static::get_user_data_from_wp_global_styles( wp_get_theme() );

		if ( array_key_exists( 'post_content', $user_cpt ) ) {
			$decoded_data = json_decode( $user_cpt['post_content'], true );

			$json_decoding_error = json_last_error();
			if ( JSON_ERROR_NONE !== $json_decoding_error ) {
				trigger_error( 'Error when decoding a theme.json schema for user data. ' . json_last_error_msg() );
				/**
				 * Filters the data provided by the user for global styles & settings.
				 *
				 * @param WP_Theme_JSON_Data_Gutenberg Class to access and update the underlying data.
				 */
				$theme_json = apply_filters( 'wp_theme_json_data_user', new WP_Theme_JSON_Data_Gutenberg( $config, 'custom' ) );
				$config     = $theme_json->get_data();
				return new WP_Theme_JSON_Gutenberg( $config, 'custom' );
			}

			// Very important to verify if the flag isGlobalStylesUserThemeJSON is true.
			// If is not true the content was not escaped and is not safe.
			if (
				is_array( $decoded_data ) &&
				isset( $decoded_data['isGlobalStylesUserThemeJSON'] ) &&
				$decoded_data['isGlobalStylesUserThemeJSON']
			) {
				unset( $decoded_data['isGlobalStylesUserThemeJSON'] );
				$config = $decoded_data;
			}
		}

		/**
		 * Filters the data provided by the user for global styles & settings.
		 *
		 * @param WP_Theme_JSON_Data_Gutenberg Class to access and update the underlying data.
		 */
		$theme_json   = apply_filters( 'wp_theme_json_data_user', new WP_Theme_JSON_Data_Gutenberg( $config, 'custom' ) );
		$config       = $theme_json->get_data();
		static::$user = new WP_Theme_JSON_Gutenberg( $config, 'custom' );

		return static::$user;
	}

	/**
	 * Returns the custom post type that contains the user's origin config
	 * for the current theme or a void array if none are found.
	 *
	 * This can also create and return a new draft custom post type.
	 *
	 * @param WP_Theme $theme              The theme object.  If empty, it
	 *                                     defaults to the current theme.
	 * @param bool     $create_post        Optional. Whether a new custom post
	 *                                     type should be created if none are
	 *                                     found.  False by default.
	 * @param array    $post_status_filter Filter Optional. custom post type by
	 *                                     post status.  ['publish'] by default,
	 *                                     so it only fetches published posts.
	 * @return array Custom Post Type for the user's origin config.
	 */
	public static function get_user_data_from_wp_global_styles( $theme, $create_post = false, $post_status_filter = array( 'publish' ) ) {
		if ( ! $theme instanceof WP_Theme ) {
			$theme = wp_get_theme();
		}
		$user_cpt         = array();
		$post_type_filter = 'wp_global_styles';
		$args             = array(
			'numberposts' => 1,
			'orderby'     => 'date',
			'order'       => 'desc',
			'post_type'   => $post_type_filter,
			'post_status' => $post_status_filter,
			'tax_query'   => array(
				array(
					'taxonomy' => 'wp_theme',
					'field'    => 'name',
					'terms'    => $theme->get_stylesheet(),
				),
			),
		);

		$recent_posts = wp_get_recent_posts( $args );
		if ( is_array( $recent_posts ) && ( count( $recent_posts ) === 1 ) ) {
			$user_cpt = $recent_posts[0];
		} elseif ( $create_post ) {
			$cpt_post_id = wp_insert_post(
				array(
					'post_content' => '{"version": ' . WP_Theme_JSON_Gutenberg::LATEST_SCHEMA . ', "isGlobalStylesUserThemeJSON": true }',
					'post_status'  => 'publish',
					'post_title'   => __( 'Custom Styles', 'default' ),
					'post_type'    => $post_type_filter,
					'post_name'    => 'wp-global-styles-' . urlencode( wp_get_theme()->get_stylesheet() ),
					'tax_input'    => array(
						'wp_theme' => array( wp_get_theme()->get_stylesheet() ),
					),
				),
				true
			);
			$user_cpt    = get_post( $cpt_post_id, ARRAY_A );
		}

		return $user_cpt;
	}
}
