<?php
/**
 * Content Guidelines Revisions REST API Controller.
 *
 * Specialized revisions controller mounted under /wp/v2/content-guidelines.
 * Inherits standard WordPress revision list/get behavior and adds
 * guideline_categories to responses plus a restore endpoint that returns the
 * parent post in the singleton response shape. The standard
 * /wp/v2/guidelines/{id}/revisions route is served by the default
 * WP_REST_Revisions_Controller.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST API controller for content guidelines revisions.
 */
class Gutenberg_Content_Guidelines_Revisions_Controller extends WP_REST_Revisions_Controller {

	/**
	 * The base of the parent controller's route.
	 *
	 * Re-declared (not inherited) because the parent class keeps its own copy
	 * private; the override is what lets register_routes() mount under
	 * /wp/v2/content-guidelines instead of the post type's standard rest_base.
	 *
	 * @var string
	 */
	protected $parent_base;

	/**
	 * Parent post type.
	 *
	 * Re-declared for the same reason as $parent_base — used by
	 * restore_revision_permissions_check() in this class.
	 *
	 * @var string
	 */
	protected $parent_post_type;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( Gutenberg_Guidelines_Post_Type::POST_TYPE );

		$this->parent_post_type = Gutenberg_Guidelines_Post_Type::POST_TYPE;
		$this->parent_base      = Gutenberg_Content_Guidelines_REST_Controller::REST_BASE;
	}

	/**
	 * Registers the routes for guideline revisions.
	 *
	 * Mirrors the route shape of WP_REST_Revisions_Controller::register_routes()
	 * but uses this controller's $parent_base so the same class can be mounted
	 * under multiple parent bases (e.g. /content-guidelines and /guidelines).
	 * The parent's $parent_base is private, so calling parent::register_routes()
	 * would always register under the post type's rest_base regardless of any
	 * override done here.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->parent_base . '/(?P<parent>[\d]+)/' . $this->rest_base,
			array(
				'args'   => array(
					'parent' => array(
						'description' => __( 'The ID for the parent of the revision.', 'gutenberg' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->parent_base . '/(?P<parent>[\d]+)/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args'   => array(
					'parent' => array(
						'description' => __( 'The ID for the parent of the revision.', 'gutenberg' ),
						'type'        => 'integer',
					),
					'id'     => array(
						'description' => __( 'Unique identifier for the revision.', 'gutenberg' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'context' => $this->get_context_param( array( 'default' => 'view' ) ),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
					'args'                => array(
						'force' => array(
							'type'        => 'boolean',
							'default'     => false,
							'description' => __( 'Required to be true, as revisions do not support trashing.', 'gutenberg' ),
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->parent_base . '/(?P<parent>[\d]+)/' . $this->rest_base . '/(?P<id>[\d]+)/restore',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'restore_revision' ),
					'permission_callback' => array( $this, 'restore_revision_permissions_check' ),
					'args'                => array(
						'parent' => array(
							'description' => __( 'The ID for the parent of the revision.', 'gutenberg' ),
							'type'        => 'integer',
						),
						'id'     => array(
							'description' => __( 'Unique identifier for the revision to restore.', 'gutenberg' ),
							'type'        => 'integer',
						),
					),
				),
			)
		);
	}

	/**
	 * Resolves a parent post ID to a content-typed guideline post.
	 *
	 * Restricts /wp/v2/content-guidelines/{parent}/revisions to parents tagged
	 * with the `content` term. Revisions of other guideline types are
	 * addressable only via the standard /wp/v2/guidelines collection.
	 *
	 * @param int $parent_post_id Supplied ID.
	 * @return WP_Post|WP_Error Post object if ID is valid, WP_Error otherwise.
	 */
	protected function get_parent( $parent_post_id ) {
		$parent = parent::get_parent( $parent_post_id );
		if ( is_wp_error( $parent ) ) {
			return $parent;
		}

		if ( ! Gutenberg_Guidelines_Post_Type::is_content_guideline( $parent->ID ) ) {
			return new WP_Error(
				'rest_post_invalid_parent',
				__( 'Invalid post parent ID.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		return $parent;
	}

	/**
	 * Prepares the revision for the REST response.
	 *
	 * Adds guideline_categories from revision meta to the standard revision response.
	 *
	 * @param WP_Post         $item    Post revision object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$fields = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'guideline_categories', $fields ) ) {
			$data                         = $response->get_data();
			$guideline_categories         = Gutenberg_Guidelines_Post_Type::get_guideline_categories_from_meta( $item->ID );
			$data['guideline_categories'] = ! empty( $guideline_categories ) ? $guideline_categories : new stdClass();
			$response->set_data( $data );
		}

		// Add embeddable author link to get author name in revision history screen
		if ( ! empty( $item->post_author ) ) {
			$response->add_link(
				'author',
				rest_url( 'wp/v2/users/' . $item->post_author ),
				array( 'embeddable' => true )
			);
		}

		return $response;
	}

	/**
	 * Retrieves the revision's schema, conforming to JSON Schema.
	 *
	 * Adds guideline_categories to the standard revision schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['guideline_categories'] = array(
			'description' => __( 'The guideline categories and their content.', 'gutenberg' ),
			'type'        => 'object',
			'context'     => array( 'view', 'edit' ),
			'readonly'    => true,
		);

		return $schema;
	}

	/**
	 * Restricts revision deletion to administrators.
	 *
	 * The inherited check only requires `delete_post` on the parent and the
	 * revision. The singleton route is admin-managed for every other write,
	 * so deleting revisions follows the same rule.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) {
		$parent = $this->get_parent( $request['parent'] );
		if ( is_wp_error( $parent ) ) {
			return $parent;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_cannot_delete',
				__( 'Sorry, you are not allowed to delete revisions.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return parent::delete_item_permissions_check( $request );
	}

	/**
	 * Checks if a given request has access to restore a revision.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access, WP_Error object otherwise.
	 */
	public function restore_revision_permissions_check( $request ) {
		$parent = $this->get_parent( $request['parent'] );
		if ( is_wp_error( $parent ) ) {
			return $parent;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_cannot_restore',
				__( 'Sorry, you are not allowed to restore revisions.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Restores a revision to the main guidelines post.
	 *
	 * Uses WordPress's native wp_restore_post_revision() which restores all
	 * revision fields, sets _edit_last meta, fires hooks, and creates a new
	 * revision for audit trail.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function restore_revision( $request ) {
		$parent = $this->get_parent( $request['parent'] );
		if ( is_wp_error( $parent ) ) {
			return $parent;
		}

		$revision = get_post( $request['id'] );
		if ( ! $revision || 'revision' !== $revision->post_type || (int) $revision->post_parent !== (int) $parent->ID ) {
			return new WP_Error(
				'rest_revision_not_found',
				__( 'Revision not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$result = wp_restore_post_revision( $revision->ID );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( ! $result ) {
			return new WP_Error(
				'rest_cannot_restore',
				__( 'Could not restore revision.', 'gutenberg' ),
				array( 'status' => 500 )
			);
		}

		// Shape the restore response with the singleton controller so callers
		// get the same payload as a regular GET /wp/v2/content-guidelines/{id}.
		// The post type's registered REST controller is the standard
		// WP_REST_Posts_Controller, which would return a different shape.
		$post                 = get_post( $parent->ID );
		$singleton_controller = new Gutenberg_Content_Guidelines_REST_Controller();

		return $singleton_controller->prepare_item_for_response( $post, $request );
	}
}
