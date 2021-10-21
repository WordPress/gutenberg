<?php
/**
 * REST API: WP_REST_Global_Styles_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * A class to access to global styles.
 *
 * @see WP_REST_Posts_Controller
 */
class WP_REST_Global_Styles_Controller extends WP_REST_Posts_Controller {
	/**
	 * Constructor.
	 *
	 * @param string $post_type Post type.
	 */
	public function __construct( $post_type ) {
		parent::__construct( $post_type );
		$obj             = get_post_type_object( $post_type );
		$this->namespace = ! empty( $obj->rest_namespace ) ? $obj->rest_namespace : 'wp/v2';
	}
}
