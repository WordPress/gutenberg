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

}
