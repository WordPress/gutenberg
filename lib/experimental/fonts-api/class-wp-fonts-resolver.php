<?php
/**
 * WP_Fonts_Resolver class.
 *
 * @package    WordPress
 * @subpackage Fonts API
 * @since      X.X.X
 */

if ( class_exists( 'WP_Fonts_Resolver' ) ) {
	return;
}

/**
 * The Fonts API Resolver abstracts the processing of different data sources
 * (such as theme.json and global styles) for font interactions with the API.
 *
 * This class is for internal core usage and is not supposed to be used by
 * extenders (plugins and/or themes).
 *
 * @access private
 */
class WP_Fonts_Resolver {
	/**
	 * Defines the key structure in global styles to the fontFamily
	 * user-selected font.
	 *
	 * @since X.X.X
	 *
	 * @var string[][]
	 */
	protected static $global_styles_font_family_structure = array(
		array( 'elements', 'link', 'typography', 'fontFamily' ),
		array( 'elements', 'heading', 'typography', 'fontFamily' ),
		array( 'elements', 'caption', 'typography', 'fontFamily' ),
		array( 'elements', 'button', 'typography', 'fontFamily' ),
		array( 'typography', 'fontFamily' ),
	);

	/**
	 * Enqueues user-selected fonts via global styles.
	 *
	 * @since X.X.X
	 *
	 * @return array User selected font-families when exists, else empty array.
	 */
	public static function enqueue_user_selected_fonts() {
		$user_selected_fonts = array();
		$user_global_styles  = WP_Theme_JSON_Resolver_Gutenberg::get_user_data()->get_raw_data();
		if ( isset( $user_global_styles['styles'] ) ) {
			$user_selected_fonts = static::get_user_selected_fonts( $user_global_styles['styles'] );
		}

		if ( empty( $user_selected_fonts ) ) {
			return array();
		}

		wp_enqueue_fonts( $user_selected_fonts );
		return $user_selected_fonts;
	}

	/**
	 * Gets the user-selected font-family handles.
	 *
	 * @since X.X.X
	 *
	 * @param  array $global_styles Global styles potentially containing user-selected fonts.
	 * @return array User-selected font-families.
	 */
	private static function get_user_selected_fonts( array $global_styles ) {
		$font_families = array();

		foreach ( static::$global_styles_font_family_structure as $path ) {
			$style_value = _wp_array_get( $global_styles, $path, '' );

			$font_family = static::get_value_from_style( $style_value );
			if ( '' !== $font_family ) {
				$font_families[] = $font_family;
			}
		}

		return array_unique( $font_families );
	}

	/**
	 * Get the value (i.e. preset slug) from the given style value.
	 *
	 * @since X.X.X
	 *
	 * @param string $style       The style to parse.
	 * @param string $preset_type Optional. The type to parse. Default 'font-family'.
	 * @return string Preset slug.
	 */
	private static function get_value_from_style( $style, $preset_type = 'font-family' ) {
		if ( '' === $style ) {
			return '';
		}

		$starting_pattern = "var(--wp--preset--{$preset_type}--";
		$ending_pattern   = ')';
		if ( ! str_starts_with( $style, $starting_pattern ) ) {
			return '';
		}

		$offset = strlen( $starting_pattern );
		$length = strpos( $style, $ending_pattern ) - $offset;
		return substr( $style, $offset, $length );
	}
}
