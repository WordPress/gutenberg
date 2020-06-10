<?php
/**
 * Scripts controller.
 *
 * @package gutenberg
 */

/**
 * Class WP_REST_Scripts_Controller
 */
class WP_REST_Scripts_Controller extends WP_REST_Dependencies_Controller {
	/**
	 * WP_REST_Scripts_Controller constructor.
	 */
	public function __construct() {
		$this->namespace               = '__experimental';
		$this->rest_base               = 'scripts';
		$this->editor_block_dependency = 'editor_script';
		$this->block_dependency        = 'script';
		$this->object                  = wp_scripts();
	}

	/**
	 * Helper to get Script URL.
	 *
	 * @param string $src Script URL.
	 * @param string $ver Version URL.
	 * @param string $handle Handle name.
	 *
	 * @return string
	 */
	public function get_url( $src, $ver, $handle ) {
		if ( ! is_bool( $src ) && ! preg_match( '|^(https?:)?//|', $src ) && ! ( $this->object->content_url && 0 === strpos( $src, $this->object->content_url ) ) ) {
			$src = $this->object->base_url . $src;
		}
		if ( ! empty( $ver ) ) {
			$src = add_query_arg( 'ver', $ver, $src );
		}

		/** This filter is documented in wp-includes/class.wp-scripts.php */
		$src = esc_url( apply_filters( 'script_loader_src', $src, $handle ) );

		return esc_url( $src );
	}

	/**
	 * Get core assets.
	 *
	 * @return array
	 */
	public function get_core_assets() {
		$wp_scripts = new WP_Scripts();
		wp_default_scripts( $wp_scripts );
		wp_default_packages_vendor( $wp_scripts );
		wp_default_packages_scripts( $wp_scripts );
		$handles = wp_list_pluck( $wp_scripts->registered, 'handle' );
		$handles = array_values( $handles );

		return $handles;
	}
}
