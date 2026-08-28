<?php
/**
 * REST API: Gutenberg_REST_Template_Revisions_Controller class
 *
 * @package gutenberg
 */

/**
 * Controller which provides REST endpoints for template revisions.
 *
 * This overrides the core WP_REST_Template_Revisions_Controller to add a
 * route to restore a revision, so that the editor can restore through
 * wp_restore_post_revision().
 *
 * @see WP_REST_Template_Revisions_Controller
 */
class Gutenberg_REST_Template_Revisions_Controller extends WP_REST_Template_Revisions_Controller {

	/**
	 * The base of the parent controller's route.
	 *
	 * The parent classes keep their own copies private.
	 *
	 * @var string
	 */
	protected $restore_parent_base;

	/**
	 * Parent controller.
	 *
	 * The parent classes keep their own copies private.
	 *
	 * @var WP_REST_Controller
	 */
	protected $restore_parent_controller;

	/**
	 * Constructor.
	 *
	 * @param string $parent_post_type Post type of the parent.
	 */
	public function __construct( $parent_post_type ) {
		parent::__construct( $parent_post_type );

		$post_type_object          = get_post_type_object( $parent_post_type );
		$this->restore_parent_base = ! empty( $post_type_object->rest_base ) ? $post_type_object->rest_base : $post_type_object->name;

		$parent_controller = $post_type_object->get_rest_controller();

		if ( ! $parent_controller ) {
			$parent_controller = new WP_REST_Templates_Controller( $parent_post_type );
		}

		$this->restore_parent_controller = $parent_controller;
	}

	/**
	 * Registers the routes for template revisions, and adds a route to
	 * restore one.
	 */
	public function register_routes() {
		parent::register_routes();

		register_rest_route(
			$this->namespace,
			sprintf(
				'/%s/(?P<parent>%s%s)/%s/%s/restore',
				$this->restore_parent_base,
				/*
				 * Matches theme's directory: `/themes/<subdirectory>/<theme>/` or `/themes/<theme>/`.
				 * Excludes invalid directory name characters: `/:<>*?"|`.
				 */
				'([^\/:<>\*\?"\|]+(?:\/[^\/:<>\*\?"\|]+)?)',
				// Matches the template name.
				'[\/\w%-]+',
				$this->rest_base,
				'(?P<id>[\d]+)'
			),
			array(
				'args' => array(
					'parent' => array(
						'description'       => __( 'The id of a template' ),
						'type'              => 'string',
						'sanitize_callback' => array( $this->restore_parent_controller, '_sanitize_template_id' ),
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
