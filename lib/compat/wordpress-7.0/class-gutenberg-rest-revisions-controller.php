<?php
/**
 * REST API: Gutenberg_REST_Revisions_Controller class
 *
 * @package gutenberg
 */

/**
 * Controller which provides REST endpoint for revisions.
 *
 * This overrides the core WP_REST_Revisions_Controller to use
 * rest_is_field_included() instead of in_array() for content, title, excerpt,
 * and guid fields. This allows clients to request individual sub-fields
 * (e.g. content.raw without content.rendered) via the _fields parameter,
 * avoiding expensive rendering when only raw data is needed.
 *
 * It also adds a route to restore a revision, so that the editor can restore
 * through wp_restore_post_revision(), the same function the classic
 * revision.php screen uses.
 *
 * @see WP_REST_Revisions_Controller
 */
class Gutenberg_REST_Revisions_Controller extends WP_REST_Revisions_Controller {

	/**
	 * The base of the parent controller's route.
	 *
	 * The parent class keeps its own copy private.
	 *
	 * @var string
	 */
	protected $restore_parent_base;

	/**
	 * Constructor.
	 *
	 * @param string $parent_post_type Post type of the parent.
	 */
	public function __construct( $parent_post_type ) {
		parent::__construct( $parent_post_type );

		$post_type_object          = get_post_type_object( $parent_post_type );
		$this->restore_parent_base = ! empty( $post_type_object->rest_base ) ? $post_type_object->rest_base : $post_type_object->name;
	}

	/**
	 * Prepares the revision for the REST response.
	 *
	 * @param WP_Post         $item    Post revision object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		// Restores the more descriptive, specific name for use within this method.
		$post = $item;

		$GLOBALS['post'] = $post;

		setup_postdata( $post );

		// Don't prepare the response body for HEAD requests.
		if ( $request->is_method( 'HEAD' ) ) {
			/** This filter is documented in wp-includes/rest-api/endpoints/class-wp-rest-revisions-controller.php */
			return apply_filters( 'rest_prepare_revision', new WP_REST_Response( array() ), $post, $request );
		}

		$fields = $this->get_fields_for_response( $request );
		$data   = array();

		if ( in_array( 'author', $fields, true ) ) {
			$data['author'] = (int) $post->post_author;
		}

		if ( in_array( 'date', $fields, true ) ) {
			$data['date'] = $this->prepare_date_response( $post->post_date_gmt, $post->post_date );
		}

		if ( in_array( 'date_gmt', $fields, true ) ) {
			$data['date_gmt'] = $this->prepare_date_response( $post->post_date_gmt );
		}

		if ( in_array( 'id', $fields, true ) ) {
			$data['id'] = $post->ID;
		}

		if ( in_array( 'modified', $fields, true ) ) {
			$data['modified'] = $this->prepare_date_response( $post->post_modified_gmt, $post->post_modified );
		}

		if ( in_array( 'modified_gmt', $fields, true ) ) {
			$data['modified_gmt'] = $this->prepare_date_response( $post->post_modified_gmt );
		}

		if ( in_array( 'parent', $fields, true ) ) {
			$data['parent'] = (int) $post->post_parent;
		}

		if ( in_array( 'slug', $fields, true ) ) {
			$data['slug'] = $post->post_name;
		}

		if ( rest_is_field_included( 'guid', $fields ) ) {
			$data['guid'] = array();
		}
		if ( rest_is_field_included( 'guid.rendered', $fields ) ) {
			/** This filter is documented in wp-includes/post-template.php */
			$data['guid']['rendered'] = apply_filters( 'get_the_guid', $post->guid, $post->ID );
		}
		if ( rest_is_field_included( 'guid.raw', $fields ) ) {
			$data['guid']['raw'] = $post->guid;
		}

		if ( rest_is_field_included( 'title', $fields ) ) {
			$data['title'] = array();
		}
		if ( rest_is_field_included( 'title.raw', $fields ) ) {
			$data['title']['raw'] = $post->post_title;
		}
		if ( rest_is_field_included( 'title.rendered', $fields ) ) {
			$data['title']['rendered'] = get_the_title( $post->ID );
		}

		if ( rest_is_field_included( 'content', $fields ) ) {
			$data['content'] = array();
		}
		if ( rest_is_field_included( 'content.raw', $fields ) ) {
			$data['content']['raw'] = $post->post_content;
		}
		if ( rest_is_field_included( 'content.rendered', $fields ) ) {
			/** This filter is documented in wp-includes/post-template.php */
			$data['content']['rendered'] = apply_filters( 'the_content', $post->post_content );
		}

		if ( rest_is_field_included( 'excerpt', $fields ) ) {
			$data['excerpt'] = array();
		}
		if ( rest_is_field_included( 'excerpt.raw', $fields ) ) {
			$data['excerpt']['raw'] = $post->post_excerpt;
		}
		if ( rest_is_field_included( 'excerpt.rendered', $fields ) ) {
			$data['excerpt']['rendered'] = $this->prepare_excerpt_response( $post->post_excerpt, $post );
		}

		if ( rest_is_field_included( 'meta', $fields ) ) {
			$data['meta'] = $this->meta->get_value( $post->ID, $request );
		}

		$context  = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data     = $this->add_additional_fields_to_object( $data, $request );
		$data     = $this->filter_response_by_context( $data, $context );
		$response = rest_ensure_response( $data );

		if ( ! empty( $data['parent'] ) ) {
			$response->add_link( 'parent', rest_url( rest_get_route_for_post( $data['parent'] ) ) );
		}

		/**
		 * Filters a revision returned from the REST API.
		 *
		 * Allows modification of the revision right before it is returned.
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param WP_Post          $post     The original revision object.
		 * @param WP_REST_Request  $request  Request used to generate the response.
		 */
		return apply_filters( 'rest_prepare_revision', $response, $post, $request );
	}

	/**
	 * Registers the routes for revisions, and adds a route to restore one.
	 */
	public function register_routes() {
		parent::register_routes();

		register_rest_route(
			$this->namespace,
			'/' . $this->restore_parent_base . '/(?P<parent>[\d]+)/' . $this->rest_base . '/(?P<id>[\d]+)/restore',
			array(
				'args' => array(
					'parent' => array(
						'description' => __( 'The ID for the parent of the revision.' ),
						'type'        => 'integer',
					),
					'id'     => array(
						'description' => __( 'Unique identifier for the revision.' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'restore_item' ),
					'permission_callback' => array( $this, 'restore_item_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Checks if a given request has access to restore a revision.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to restore the item, WP_Error object otherwise.
	 */
	public function restore_item_permissions_check( $request ) {
		return gutenberg_rest_restore_revision_permissions_check( $this->get_parent( $request['parent'] ) );
	}

	/**
	 * Restores a revision.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function restore_item( $request ) {
		return gutenberg_rest_restore_revision( $this->get_parent( $request['parent'] ), $this->get_revision( $request['id'] ) );
	}
}
