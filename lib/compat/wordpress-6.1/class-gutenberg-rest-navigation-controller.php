<?php
/**
 * REST API: Gutenberg_REST_Templates_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Base Templates REST API Controller.
 */
class Gutenberg_REST_Navigation_Controller extends WP_REST_Posts_Controller {


	/**
	 * Registers the controllers routes.
	 *
	 * @return void
	 */
	public function register_routes() {

		parent::register_routes();

		// Lists a single nav item based on the given id.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\/\w-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'The slug identifier for a avigation', 'gutenberg' ),
							'type'        => 'string',
						),
					),
				),
			)
		);
	}


	/**
	 * Overide WP_REST_Posts_Controller function to query for
	 * `wp_navigation` posts by post_name / slug instead of ID.
	 *
	 * @param string $id the slug of the Navigation post.
	 * @return WP_Post|null
	 */
	protected function get_post( $id ) {

		$error = new WP_Error(
			'rest_post_invalid_id',
			__( 'Invalid post ID.' ),
			array( 'status' => 404 )
		);

		if ( ! is_string( $id ) ) {
			return $error;
		}

		$args = array(
			'name'           => $id, // query by slug
			'post_type'      => array( $this->post_type ),
			'nopaging'       => true,
			'posts_per_page' => '-1',
		);

		// The Query
		$post = new WP_Query( $args );

		if ( empty( $post ) || empty( $post->post->ID ) || $this->post_type !== $post->post->post_type ) {
			return $error;
		}

		return $post->post;
	}



}
