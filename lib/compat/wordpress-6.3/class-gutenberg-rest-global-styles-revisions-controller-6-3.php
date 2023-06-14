<?php
/**
 * REST API: Gutenberg_REST_Global_Styles_Revisions_Controller class, inspired by WP_REST_Revisions_Controller.
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.3.0
 */

/**
 * Core class used to access global styles revisions via the REST API.
 *
 * @since 6.3.0
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Global_Styles_Revisions_Controller_6_3 extends WP_REST_Controller {
	/**
	 * Parent post type.
	 *
	 * @since 6.3.0
	 * @var string
	 */
	private $parent_post_type;

	/**
	 * The base of the parent controller's route.
	 *
	 * @since 6.3.0
	 * @var string
	 */
	private $parent_base;

	/**
	 * Constructor.
	 *
	 * @since 6.3.0
	 */
	public function __construct() {
		$this->parent_post_type = 'wp_global_styles';
		$this->rest_base        = 'revisions';
		$this->parent_base      = 'global-styles';
		$this->namespace        = 'wp/v2';
	}

	/**
	 * Registers the controllers routes.
	 *
	 * @return void
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
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Returns revisions of the given global styles config custom post type.
	 *
	 * @since 6.3.0
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_items( $request ) {
		$parent = $this->get_parent( $request['parent'] );

		if ( is_wp_error( $parent ) ) {
			return $parent;
		}
		$response                         = array();
		$raw_config                       = json_decode( $parent->post_content, true );
		$is_global_styles_user_theme_json = isset( $raw_config['isGlobalStylesUserThemeJSON'] ) && true === $raw_config['isGlobalStylesUserThemeJSON'];

		if ( $is_global_styles_user_theme_json ) {
			$user_theme_revisions = wp_get_post_revisions(
				$parent->ID,
				array(
					'posts_per_page' => 100,
				)
			);

			if ( ! empty( $user_theme_revisions ) ) {
				foreach ( $user_theme_revisions as $revision ) {
					$revision   = $this->prepare_item_for_response( $revision, $request );
					$response[] = $this->prepare_response_for_collection( $revision );
				}
			}
		}

		return rest_ensure_response( $response );
	}

	/**
	 * A direct copy of WP_REST_Revisions_Controller->prepare_date_response().
	 * Checks the post_date_gmt or modified_gmt and prepare any post or
	 * modified date for single post output.
	 *
	 * @since 6.3.0
	 *
	 * @param string      $date_gmt GMT publication time.
	 * @param string|null $date     Optional. Local publication time. Default null.
	 * @return string|null ISO8601/RFC3339 formatted datetime, otherwise null.
	 */
	protected function prepare_date_response( $date_gmt, $date = null ) {
		if ( '0000-00-00 00:00:00' === $date_gmt ) {
			return null;
		}

		if ( isset( $date ) ) {
			return mysql_to_rfc3339( $date );
		}

		return mysql_to_rfc3339( $date_gmt );
	}

	/**
	 * Prepares the revision for the REST response.
	 *
	 * @since 6.3.0
	 *
	 * @param WP_Post         $post    Post revision object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $post, $request ) {
		$parent = $this->get_parent( $request['parent'] );
		// Retrieves global styles config as JSON.
		$raw_revision_config = json_decode( $post->post_content, true );
		$config              = ( new WP_Theme_JSON_Gutenberg( $raw_revision_config, 'custom' ) )->get_raw_data();

		// Prepares item data.
		$data   = array();
		$fields = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'author', $fields ) ) {
			$data['author'] = (int) $post->post_author;
		}

		if ( rest_is_field_included( 'date', $fields ) ) {
			$data['date'] = $this->prepare_date_response( $post->post_date_gmt, $post->post_date );
		}

		if ( rest_is_field_included( 'date_gmt', $fields ) ) {
			$data['date_gmt'] = $this->prepare_date_response( $post->post_date_gmt );
		}

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = (int) $post->ID;
		}

		if ( rest_is_field_included( 'modified', $fields ) ) {
			$data['modified'] = $this->prepare_date_response( $post->post_modified_gmt, $post->post_modified );
		}

		if ( rest_is_field_included( 'modified_gmt', $fields ) ) {
			$data['modified_gmt'] = $this->prepare_date_response( $post->post_modified_gmt );
		}

		if ( rest_is_field_included( 'parent', $fields ) ) {
			$data['parent'] = (int) $parent->ID;
		}

		if ( rest_is_field_included( 'settings', $fields ) ) {
			$data['settings'] = ! empty( $config['settings'] ) ? $config['settings'] : new stdClass();
		}

		if ( rest_is_field_included( 'styles', $fields ) ) {
			$data['styles'] = ! empty( $config['styles'] ) ? $config['styles'] : new stdClass();
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		return rest_ensure_response( $data );
	}

	/**
	 * Retrieves the revision's schema, conforming to JSON Schema.
	 *
	 * @since 6.3.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => "{$this->parent_post_type}-revision",
			'type'       => 'object',
			// Base properties for every Revision.
			'properties' => array(

				/*
				 * Adds settings and styles from the WP_REST_Revisions_Controller item fields.
				 * Leaves out GUID as global styles shouldn't be accessible via URL.
				 */
				'author'       => array(
					'description' => __( 'The ID for the author of the revision.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'date'         => array(
					'description' => __( "The date the revision was published, in the site's timezone.", 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'date_gmt'     => array(
					'description' => __( 'The date the revision was published, as GMT.', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
				),
				'id'           => array(
					'description' => __( 'Unique identifier for the revision.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'modified'     => array(
					'description' => __( "The date the revision was last modified, in the site's timezone.", 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
				),
				'modified_gmt' => array(
					'description' => __( 'The date the revision was last modified, as GMT.', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
				),
				'parent'       => array(
					'description' => __( 'The ID for the parent of the revision.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),

				// Adds settings and styles from the WP_REST_Global_Styles_Controller parent schema.
				'styles'       => array(
					'description' => __( 'Global styles.', 'gutenberg' ),
					'type'        => array( 'object' ),
					'context'     => array( 'view', 'edit' ),
				),
				'settings'     => array(
					'description' => __( 'Global settings.', 'gutenberg' ),
					'type'        => array( 'object' ),
					'context'     => array( 'view', 'edit' ),
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Checks if a given request has access to read a single global style.
	 *
	 * @since 6.3.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		$post = $this->get_parent( $request['parent'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		/*
		 * The same check as WP_REST_Global_Styles_Controller->get_item_permissions_check.
		 */
		if ( ! current_user_can( 'read_post', $post->ID ) ) {
			return new WP_Error(
				'rest_cannot_view',
				__( 'Sorry, you are not allowed to view revisions for this global style.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Get the parent post, if the ID is valid. Copied from WP_REST_Revisions_Controller.
	 *
	 * @since 6.3.0
	 *
	 * @param int $parent_post_id Supplied ID.
	 * @return WP_Post|WP_Error Post object if ID is valid, WP_Error otherwise.
	 */
	protected function get_parent( $parent_post_id ) {
		$error = new WP_Error(
			'rest_post_invalid_parent',
			__( 'Invalid post parent ID.', 'gutenberg' ),
			array( 'status' => 404 )
		);

		if ( (int) $parent_post_id <= 0 ) {
			return $error;
		}

		$parent_post = get_post( (int) $parent_post_id );

		if ( empty( $parent_post ) || empty( $parent_post->ID )
			|| $this->parent_post_type !== $parent_post->post_type
		) {
			return $error;
		}

		return $parent_post;
	}
}
