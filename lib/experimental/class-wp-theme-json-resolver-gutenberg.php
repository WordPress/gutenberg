<?php
/**
 * WP_Theme_JSON_Resolver_Gutenberg class
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
class WP_Theme_JSON_Resolver_Gutenberg extends WP_Theme_JSON_Resolver_6_2 {

	/**
	 * Returns the custom post type that contains the user's origin config
	 * for the active theme or a void array if none are found.
	 *
	 * This can also create and return a new draft custom post type.
	 *
	 *
	 * @param WP_Theme $theme              The theme object. If empty, it
	 *                                     defaults to the active theme.
	 * @param bool     $create_post        Optional. Whether a new custom post
	 *                                     type should be created if none are
	 *                                     found. Default false.
	 * @param array    $post_status_filter Optional. Filter custom post type by
	 *                                     post status. Default `array( 'publish' )`,
	 *                                     so it only fetches published posts.
	 * @return array Custom Post Type for the user's origin config.
	 */
	public static function get_user_data_from_wp_global_styles( $theme, $create_post = false, $post_status_filter = array( 'publish' ) ) {
		if ( ! $theme instanceof WP_Theme ) {
			$theme = wp_get_theme();
		}

		/*
		 * Bail early if the theme does not support a theme.json.
		 *
		 * Since WP_Theme_JSON_Resolver::theme_has_support() only supports the active
		 * theme, the extra condition for whether $theme is the active theme is
		 * present here.
		 */
		if ( $theme->get_stylesheet() === get_stylesheet() && ! static::theme_has_support() ) {
			return array();
		}

		$user_cpt         = array();
		$post_type_filter = 'wp_global_styles';
		$stylesheet       = $theme->get_stylesheet();
		$args = array(
			'posts_per_page'         => 1,
			'orderby'                => 'date',
			'order'                  => 'desc',
			'post_type'              => $post_type_filter,
			'post_status'            => $post_status_filter,
			'ignore_sticky_posts'    => true,
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query'              => array(
				array(
					'taxonomy' => 'wp_theme',
					'field'    => 'name',
					'terms'    => $stylesheet,
				),
			),
		);

		$global_style_query = new WP_Query();
		$recent_posts       = $global_style_query->query( $args );
		if ( count( $recent_posts ) === 1 ) {
			$user_cpt = get_object_vars( $recent_posts[0] );
		} elseif ( $create_post ) {
			$cpt_post_id = wp_insert_post(
				array(
					'post_content' => '{"version": ' . WP_Theme_JSON::LATEST_SCHEMA . ', "isGlobalStylesUserThemeJSON": true }',
					'post_status'  => 'publish',
					'post_title'   => 'Custom Styles', // Do not make string translatable, see https://core.trac.wordpress.org/ticket/54518.
					'post_type'    => $post_type_filter,
					'post_name'    => sprintf( 'wp-global-styles-%s', urlencode( $stylesheet ) ),
					'tax_input'    => array(
						'wp_theme' => array( $stylesheet ),
					),
				),
				true
			);
			if ( ! is_wp_error( $cpt_post_id ) ) {
				$user_cpt = get_object_vars( get_post( $cpt_post_id ) );
			}
		}

		return $user_cpt;
	}

	/**
	 * Returns the theme's data.
	 *
	 * Data from theme.json will be backfilled from existing
	 * theme supports, if any. Note that if the same data
	 * is present in theme.json and in theme supports,
	 * the theme.json takes precedence.
	 *
	 * @param array $deprecated Deprecated argument.
	 * @param array $settings Contains a key called with_supports to determine whether to include theme supports in the data.
	 * @return WP_Theme_JSON_Gutenberg Entity that holds theme data.
	 */
	public static function get_theme_data( $deprecated = array(), $settings = array( 'with_supports' => true ) ) {
		if ( ! empty( $deprecated ) ) {
			_deprecated_argument( __METHOD__, '5.9' );
		}

		// When backporting to core, remove the instanceof Gutenberg class check, as it is only required for the Gutenberg plugin.
		if ( null === static::$theme || ! static::$theme instanceof WP_Theme_JSON_Gutenberg ) {
			$theme_json_data = static::read_json_file( static::get_file_path_from_theme( 'theme.json' ) );
			$theme_json_data = static::translate( $theme_json_data, wp_get_theme()->get( 'TextDomain' ) );
			$theme_json_data = gutenberg_add_registered_webfonts_to_theme_json( $theme_json_data );

			/**
			 * Filters the data provided by the theme for global styles & settings.
			 *
			 * @param WP_Theme_JSON_Data_Gutenberg Class to access and update the underlying data.
			 */
			$theme_json      = apply_filters( 'wp_theme_json_data_theme', new WP_Theme_JSON_Data_Gutenberg( $theme_json_data, 'theme' ) );
			$theme_json_data = $theme_json->get_data();
			static::$theme   = new WP_Theme_JSON_Gutenberg( $theme_json_data );

			if ( wp_get_theme()->parent() ) {
				// Get parent theme.json.
				$parent_theme_json_data = static::read_json_file( static::get_file_path_from_theme( 'theme.json', true ) );
				$parent_theme_json_data = static::translate( $parent_theme_json_data, wp_get_theme()->parent()->get( 'TextDomain' ) );
				$parent_theme_json_data = gutenberg_add_registered_webfonts_to_theme_json( $parent_theme_json_data );
				$parent_theme           = new WP_Theme_JSON_Gutenberg( $parent_theme_json_data );

				// Merge the child theme.json into the parent theme.json.
				// The child theme takes precedence over the parent.
				$parent_theme->merge( static::$theme );
				static::$theme = $parent_theme;
			}
		}

		if ( ! $settings['with_supports'] ) {
			return static::$theme;
		}

		/*
		 * We want the presets and settings declared in theme.json
		 * to override the ones declared via theme supports.
		 * So we take theme supports, transform it to theme.json shape
		 * and merge the static::$theme upon that.
		 */
		$theme_support_data = WP_Theme_JSON_Gutenberg::get_from_editor_settings( get_default_block_editor_settings() );
		if ( ! wp_theme_has_theme_json() ) {
			if ( ! isset( $theme_support_data['settings']['color'] ) ) {
				$theme_support_data['settings']['color'] = array();
			}

			$default_palette = false;
			if ( current_theme_supports( 'default-color-palette' ) ) {
				$default_palette = true;
			}
			if ( ! isset( $theme_support_data['settings']['color']['palette'] ) ) {
				// If the theme does not have any palette, we still want to show the core one.
				$default_palette = true;
			}
			$theme_support_data['settings']['color']['defaultPalette'] = $default_palette;

			$default_gradients = false;
			if ( current_theme_supports( 'default-gradient-presets' ) ) {
				$default_gradients = true;
			}
			if ( ! isset( $theme_support_data['settings']['color']['gradients'] ) ) {
				// If the theme does not have any gradients, we still want to show the core ones.
				$default_gradients = true;
			}
			$theme_support_data['settings']['color']['defaultGradients'] = $default_gradients;

			// Classic themes without a theme.json don't support global duotone.
			$theme_support_data['settings']['color']['defaultDuotone'] = false;

			// Allow themes to enable appearance tools via theme_support.
			if ( current_theme_supports( 'appearance-tools' ) ) {
				$theme_support_data['settings']['appearanceTools'] = true;
			}
		}
		$with_theme_supports = new WP_Theme_JSON_Gutenberg( $theme_support_data );
		$with_theme_supports->merge( static::$theme );

		return $with_theme_supports;
	}

	/**
	 * Gets the styles for blocks from the block.json file.
	 *
	 * @return WP_Theme_JSON
	 */
	public static function get_block_data() {
		$registry = WP_Block_Type_Registry::get_instance();
		$blocks   = $registry->get_all_registered();
		$config   = array( 'version' => 1 );
		foreach ( $blocks as $block_name => $block_type ) {
			if ( isset( $block_type->supports['__experimentalStyle'] ) ) {
				$config['styles']['blocks'][ $block_name ] = static::remove_JSON_comments( $block_type->supports['__experimentalStyle'] );
			}

			if (
				isset( $block_type->supports['spacing']['blockGap']['__experimentalDefault'] ) &&
				null === _wp_array_get( $config, array( 'styles', 'blocks', $block_name, 'spacing', 'blockGap' ), null )
			) {
				// Ensure an empty placeholder value exists for the block, if it provides a default blockGap value.
				// The real blockGap value to be used will be determined when the styles are rendered for output.
				$config['styles']['blocks'][ $block_name ]['spacing']['blockGap'] = null;
			}
		}

		/**
		 * Filters the data provided by the blocks for global styles & settings.
		 *
		 * @param WP_Theme_JSON_Data_Gutenberg Class to access and update the underlying data.
		 */
		$theme_json = apply_filters( 'wp_theme_json_data_blocks', new WP_Theme_JSON_Data_Gutenberg( $config, 'blocks' ) );
		$config     = $theme_json->get_data();

		return new WP_Theme_JSON_Gutenberg( $config, 'blocks' );
	}

	/**
	 * When given an array, this will remove any keys with the name `//`.
	 *
	 * @param array $array The array to filter.
	 * @return array The filtered array.
	 */
	private static function remove_JSON_comments( $array ) {
		unset( $array['//'] );
		foreach ( $array as $k => $v ) {
			if ( is_array( $v ) ) {
				$array[ $k ] = static::remove_JSON_comments( $v );
			}
		}

		return $array;
	}

	/**
	 * Returns the data merged from multiple origins.
	 *
	 * There are three sources of data (origins) for a site:
	 * default, theme, and custom. The custom's has higher priority
	 * than the theme's, and the theme's higher than default's.
	 *
	 * Unlike the getters {@link get_core_data},
	 * {@link get_theme_data}, and {@link get_user_data},
	 * this method returns data after it has been merged
	 * with the previous origins. This means that if the same piece of data
	 * is declared in different origins (user, theme, and core),
	 * the last origin overrides the previous.
	 *
	 * For example, if the user has set a background color
	 * for the paragraph block, and the theme has done it as well,
	 * the user preference wins.
	 *
	 * @since 5.8.0
	 * @since 5.9.0 Added user data, removed the `$settings` parameter,
	 *              added the `$origin` parameter.
	 *
	 * @param string $origin Optional. To what level should we merge data.
	 *                       Valid values are 'theme' or 'custom'. Default 'custom'.
	 * @return WP_Theme_JSON
	 */
	public static function get_merged_data( $origin = 'custom' ) {
		if ( is_array( $origin ) ) {
			_deprecated_argument( __FUNCTION__, '5.9' );
		}

		$result = new WP_Theme_JSON_Gutenberg();
		$result->merge( static::get_core_data() );
		$result->merge( static::get_block_data() );
		$result->merge( static::get_theme_data() );
		if ( 'custom' === $origin ) {
			$result->merge( static::get_user_data() );
		}
		// Generate the default spacing sizes presets.
		$result->set_spacing_sizes();

		return $result;
	}
}
