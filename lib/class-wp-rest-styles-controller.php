<?php
/**
 * Styles controller.
 *
 * @package gutenberg
 */

/**
 * Class WP_REST_Styles_Controller
 */
class WP_REST_Styles_Controller extends WP_REST_Dependencies_Controller {
	/**
	 * WP_REST_Styles_Controller constructor.
	 */
	public function __construct() {
		$this->namespace               = '__experimental';
		$this->rest_base               = 'styles';
		$this->editor_block_dependency = 'editor_style';
		$this->block_dependency        = 'style';
		$this->object                  = wp_styles();
	}

	/**
	 * Helper to get Style URL.
	 *
	 * @param string $src Style URL.
	 * @param string $ver Version URL.
	 * @param string $handle Handle name.
	 *
	 * @return string
	 */
	public function get_url( $src, $ver, $handle ) {
		return $this->object->_css_href( $src, $ver, $handle );
	}

	/**
	 * Get core assets.
	 *
	 * @return array
	 */
	public function get_core_assets() {
		$wp_styles = new WP_Styles();
		wp_default_styles( $wp_styles );
		$handles = wp_list_pluck( $wp_styles->registered, 'handle' );
		$handles = array_values( $handles );

		return $handles;
	}
}
