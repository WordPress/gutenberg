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

		// Lists a single nav item based on the given id or slug.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/((?P<id>[\d]+)|(?P<slug>[\w\-]+))',
			array(
				'args'        => array(
					'slug' => array(
						'description' => __( 'The slug identifier for a Navigation', 'gutenberg' ),
						'type'        => 'string',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::READABLE ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
					'args'                => array(
						'force' => array(
							'type'        => 'boolean',
							'default'     => false,
							'description' => __( 'Whether to bypass Trash and force deletion.' ),
						),
					),
				),
				'allow_batch' => $this->allow_batch,
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Overide WP_REST_Posts_Controller parent function to query for
	 * `wp_navigation` posts by slug (post_name) instead of ID.
	 *
	 * This is required to successfully process OPTIONS requests as with
	 * these the `rest_request_before_callbacks` method which is used to
	 * map slug to postId does not run which means `get_post` will not
	 * behave as expected.
	 *
	 * The function will continue to delegate to the parent implementation
	 * if the $id argument is ID-based, thereby ensuring backwards
	 * compatbility.
	 *
	 * It may be possible to remove this implemenation in future releases.
	 *
	 * See: https://github.com/WordPress/gutenberg/pull/43703.
	 *
	 * @param string $id the slug of the Navigation post.
	 * @return WP_Post|null
	 */
	protected function get_post( $id ) {

		// Handle ID based $id param.
		if ( is_numeric( $id ) ) {
			return parent::get_post( $id );
		}

		// For string based $id the argument is a "slug".
		// Lookup Post using `post_name` query.
		$slug = $id;

		$args = array(
			'name'                   => $slug,
			'post_type'              => 'wp_navigation',
			'nopaging'               => true,
			'posts_per_page'         => '1',
			'update_post_term_cache' => false,
			'no_found_rows'          => true,
		);

		// Query for the Navigation Post by slug (post_name).
		$query = new WP_Query( $args );

		if ( empty( $query->posts ) ) {
			return new WP_Error(
				'rest_post_not_found',
				__( 'No navigation found.' ),
				array( 'status' => 404 )
			);
		}

		return $query->posts[0];
	}
}
