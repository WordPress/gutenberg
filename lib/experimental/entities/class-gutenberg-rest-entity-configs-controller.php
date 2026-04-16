<?php
/**
 * REST API: Gutenberg_REST_Entity_Configs_Controller class
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST API controller for entity configurations.
 */
class Gutenberg_REST_Entity_Configs_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'gutenberg/v1';
		$this->rest_base = 'entity-configs';
	}

	/**
	 * Registers the routes for entity configs.
	 */
	public function register_routes() {
		// Collection route: list all and create new.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_create_item_args(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		// Single item route: get, update, delete.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<entity_type>post_type|taxonomy)/(?P<slug>[a-z0-9_-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_update_item_args(),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			)
		);
	}

	/**
	 * Checks if the current user has permission to manage entity configs.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access, WP_Error otherwise.
	 */
	public function permissions_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to manage entity configurations.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Retrieves all entity configurations.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function get_items( $request ) {
		$configs = get_option( Gutenberg_Entity_Manager::OPTION_NAME, array() );
		$result  = array();

		if ( ! empty( $configs['post_types'] ) ) {
			foreach ( $configs['post_types'] as $slug => $config ) {
				$result[] = $this->prepare_config_for_response( $slug, 'post_type', $config );
			}
		}

		if ( ! empty( $configs['taxonomies'] ) ) {
			foreach ( $configs['taxonomies'] as $slug => $config ) {
				$result[] = $this->prepare_config_for_response( $slug, 'taxonomy', $config );
			}
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Retrieves a single entity configuration.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object or error.
	 */
	public function get_item( $request ) {
		$entity_type = $request['entity_type'];
		$slug        = $request['slug'];
		$configs     = get_option( Gutenberg_Entity_Manager::OPTION_NAME, array() );
		$key         = 'post_type' === $entity_type ? 'post_types' : 'taxonomies';

		if ( empty( $configs[ $key ][ $slug ] ) ) {
			return new WP_Error(
				'rest_entity_config_not_found',
				__( 'Entity configuration not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$config = $configs[ $key ][ $slug ];

		return rest_ensure_response( $this->prepare_config_for_response( $slug, $entity_type, $config ) );
	}

	/**
	 * Creates a new entity configuration.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object or error.
	 */
	public function create_item( $request ) {
		$entity_type = $request['entity_type'];
		$slug        = sanitize_key( $request['slug'] );
		$configs     = get_option( Gutenberg_Entity_Manager::OPTION_NAME, array() );
		$key         = 'post_type' === $entity_type ? 'post_types' : 'taxonomies';

		if ( empty( $slug ) ) {
			return new WP_Error(
				'rest_invalid_slug',
				__( 'Entity slug is required.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		// Check for slug conflicts.
		if ( ! empty( $configs[ $key ][ $slug ] ) ) {
			return new WP_Error(
				'rest_entity_config_exists',
				__( 'An entity with this slug already exists.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		if ( 'post_type' === $entity_type && post_type_exists( $slug ) ) {
			return new WP_Error(
				'rest_entity_config_exists',
				__( 'A post type with this slug is already registered.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		if ( 'taxonomy' === $entity_type && taxonomy_exists( $slug ) ) {
			return new WP_Error(
				'rest_entity_config_exists',
				__( 'A taxonomy with this slug is already registered.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		$config                   = $this->prepare_config_from_request( $request, $entity_type );
		$config['_user_created']  = true;
		$configs[ $key ][ $slug ] = $config;

		update_option( Gutenberg_Entity_Manager::OPTION_NAME, $configs, false );

		// Register immediately so it's available in the current request.
		if ( 'post_type' === $entity_type ) {
			$supports = array();
			if ( ! empty( $config['supports'] ) ) {
				$supports = array_keys( array_filter( $config['supports'] ) );
			}
			if ( empty( $supports ) ) {
				$supports = array( 'title', 'editor' );
			}

			register_post_type(
				$slug,
				array(
					'labels'        => $config['labels'] ?? array(),
					'description'   => $config['description'] ?? '',
					'public'        => $config['public'] ?? true,
					'hierarchical'  => $config['hierarchical'] ?? false,
					'supports'      => $supports,
					'has_archive'   => $config['has_archive'] ?? false,
					'rewrite'       => $config['rewrite'] ?? true,
					'show_in_rest'  => $config['show_in_rest'] ?? true,
					'rest_base'     => $config['rest_base'] ?? $slug,
					'menu_icon'     => $config['menu_icon'] ?? 'dashicons-admin-post',
					'menu_position' => $config['menu_position'] ?? null,
					'show_ui'       => $config['show_ui'] ?? true,
					'show_in_menu'  => $config['show_in_menu'] ?? true,
					'taxonomies'    => $config['taxonomies'] ?? array(),
				)
			);
		} else {
			register_taxonomy(
				$slug,
				$config['object_type'] ?? array( 'post' ),
				array(
					'labels'       => $config['labels'] ?? array(),
					'description'  => $config['description'] ?? '',
					'public'       => $config['public'] ?? true,
					'hierarchical' => $config['hierarchical'] ?? false,
					'show_in_rest' => $config['show_in_rest'] ?? true,
					'rest_base'    => $config['rest_base'] ?? $slug,
					'show_ui'      => $config['show_ui'] ?? true,
					'show_in_menu' => $config['show_in_menu'] ?? true,
					'rewrite'      => $config['rewrite'] ?? true,
				)
			);
		}

		// Flag that rewrite rules need flushing.
		set_transient( 'gutenberg_entity_configs_flush_rewrite', true, 60 );

		$response = rest_ensure_response( $this->prepare_config_for_response( $slug, $entity_type, $config ) );
		$response->set_status( 201 );

		return $response;
	}

	/**
	 * Updates an existing entity configuration.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object or error.
	 */
	public function update_item( $request ) {
		$entity_type = $request['entity_type'];
		$slug        = $request['slug'];
		$configs     = get_option( Gutenberg_Entity_Manager::OPTION_NAME, array() );
		$key         = 'post_type' === $entity_type ? 'post_types' : 'taxonomies';

		if ( empty( $configs[ $key ][ $slug ] ) ) {
			return new WP_Error(
				'rest_entity_config_not_found',
				__( 'Entity configuration not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$existing = $configs[ $key ][ $slug ];
		$updated  = $this->prepare_config_from_request( $request, $entity_type );

		// Merge updated fields into existing config.
		$config                   = array_merge( $existing, $updated );
		$config['_user_created']  = $existing['_user_created'];
		$config['_customized']    = true;
		$configs[ $key ][ $slug ] = $config;

		update_option( Gutenberg_Entity_Manager::OPTION_NAME, $configs, false );

		// Flag that rewrite rules need flushing.
		set_transient( 'gutenberg_entity_configs_flush_rewrite', true, 60 );

		return rest_ensure_response( $this->prepare_config_for_response( $slug, $entity_type, $config ) );
	}

	/**
	 * Deletes an entity configuration.
	 *
	 * Only user-created entities can be deleted.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object or error.
	 */
	public function delete_item( $request ) {
		$entity_type = $request['entity_type'];
		$slug        = $request['slug'];
		$configs     = get_option( Gutenberg_Entity_Manager::OPTION_NAME, array() );
		$key         = 'post_type' === $entity_type ? 'post_types' : 'taxonomies';

		if ( empty( $configs[ $key ][ $slug ] ) ) {
			return new WP_Error(
				'rest_entity_config_not_found',
				__( 'Entity configuration not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$config        = $configs[ $key ][ $slug ];
		$is_registered = 'post_type' === $entity_type
			? post_type_exists( $slug )
			: taxonomy_exists( $slug );

		// Determine if this is a core-registered entity (not user-created).
		$is_core = false;
		if ( empty( $config['_user_created'] ) && $is_registered ) {
			if ( 'post_type' === $entity_type ) {
				$object  = get_post_type_object( $slug );
				$is_core = ! empty( $object->_builtin );
			} else {
				$object  = get_taxonomy( $slug );
				$is_core = ! empty( $object->_builtin );
			}
		}

		// Core entities can only be reverted (when they have been customized),
		// never deleted. An uncustomized core entity has no stored deviations
		// to remove, so blocking prevents accidental no-op churn.
		if ( $is_core && empty( $config['_customized'] ) ) {
			return new WP_Error(
				'rest_entity_config_not_deletable',
				__( 'Core entities cannot be deleted.', 'gutenberg' ),
				array( 'status' => 403 )
			);
		}

		// For user-created entities, unregister so the type/taxonomy is
		// fully removed. For plugin-registered entities (revert), leave the
		// live registration alone — the plugin re-registers it on every
		// request, and auto-detection will re-seed the config with default
		// values on the next page load.
		if ( ! empty( $config['_user_created'] ) ) {
			if ( 'post_type' === $entity_type && post_type_exists( $slug ) ) {
				unregister_post_type( $slug );
			} elseif ( 'taxonomy' === $entity_type && taxonomy_exists( $slug ) ) {
				unregister_taxonomy( $slug );
			}
		}

		unset( $configs[ $key ][ $slug ] );
		update_option( Gutenberg_Entity_Manager::OPTION_NAME, $configs, false );

		// Flag that rewrite rules need flushing.
		set_transient( 'gutenberg_entity_configs_flush_rewrite', true, 60 );

		return rest_ensure_response( array( 'deleted' => true ) );
	}

	/**
	 * Prepares an entity config for the REST response.
	 *
	 * @param string $slug        The entity slug.
	 * @param string $entity_type The entity type (post_type or taxonomy).
	 * @param array  $config      The stored configuration.
	 * @return array The response data.
	 */
	private function prepare_config_for_response( $slug, $entity_type, $config ) {
		$is_registered = 'post_type' === $entity_type
			? post_type_exists( $slug )
			: taxonomy_exists( $slug );

		// An entity is orphaned when it's stored but no longer registered
		// (e.g., the plugin that created it was deactivated).
		$is_orphaned = ! $is_registered && empty( $config['_user_created'] );

		// Compute _source from the live type object when possible so the
		// classification self-heals even if the stored config predates the
		// _source field or the entity's source has changed.
		if ( ! empty( $config['_user_created'] ) ) {
			$source = 'user';
		} elseif ( 'post_type' === $entity_type && $is_registered ) {
			$type_object = get_post_type_object( $slug );
			$source      = ! empty( $type_object->_builtin ) ? 'core' : 'plugin';
		} elseif ( 'taxonomy' === $entity_type && $is_registered ) {
			$taxonomy_object = get_taxonomy( $slug );
			$source          = ! empty( $taxonomy_object->_builtin ) ? 'core' : 'plugin';
		} else {
			// Orphaned and unknown: fall back to stored value or 'plugin'.
			$source = $config['_source'] ?? 'plugin';
		}

		return array_merge(
			$config,
			array(
				'slug'        => $slug,
				'entity_type' => $entity_type,
				'_source'     => $source,
				'_orphaned'   => $is_orphaned,
				'_customized' => ! empty( $config['_customized'] ),
			)
		);
	}

	/**
	 * Builds a configuration array from the REST request.
	 *
	 * @param WP_REST_Request $request     Full details about the request.
	 * @param string          $entity_type The entity type (post_type or taxonomy).
	 * @return array The configuration data.
	 */
	private function prepare_config_from_request( $request, $entity_type ) {
		$config = array();

		$common_fields = array(
			'labels',
			'description',
			'public',
			'hierarchical',
			'show_in_rest',
			'rest_base',
			'show_ui',
			'show_in_menu',
			'rewrite',
		);

		foreach ( $common_fields as $field ) {
			if ( isset( $request[ $field ] ) ) {
				$config[ $field ] = $request[ $field ];
			}
		}

		if ( 'post_type' === $entity_type ) {
			$post_type_fields = array(
				'supports',
				'has_archive',
				'menu_icon',
				'menu_position',
				'taxonomies',
			);
			foreach ( $post_type_fields as $field ) {
				if ( isset( $request[ $field ] ) ) {
					$config[ $field ] = $request[ $field ];
				}
			}
		}

		if ( 'taxonomy' === $entity_type ) {
			if ( isset( $request['object_type'] ) ) {
				$config['object_type'] = $request['object_type'];
			}
		}

		return $config;
	}

	/**
	 * Gets the arguments for creating an entity config.
	 *
	 * @return array The create arguments.
	 */
	private function get_create_item_args() {
		return array(
			'entity_type' => array(
				'description' => __( 'The entity type.', 'gutenberg' ),
				'type'        => 'string',
				'enum'        => array( 'post_type', 'taxonomy' ),
				'required'    => true,
			),
			'slug'        => array(
				'description'       => __( 'The entity slug.', 'gutenberg' ),
				'type'              => 'string',
				'required'          => true,
				'sanitize_callback' => 'sanitize_key',
			),
			'labels'      => array(
				'description' => __( 'The entity labels.', 'gutenberg' ),
				'type'        => 'object',
			),
			'description' => array(
				'description' => __( 'A description of the entity.', 'gutenberg' ),
				'type'        => 'string',
			),
			'public'      => array(
				'description' => __( 'Whether the entity is public.', 'gutenberg' ),
				'type'        => 'boolean',
			),
			'hierarchical' => array(
				'description' => __( 'Whether the entity is hierarchical.', 'gutenberg' ),
				'type'        => 'boolean',
			),
			'show_in_rest' => array(
				'description' => __( 'Whether to expose via REST API.', 'gutenberg' ),
				'type'        => 'boolean',
			),
			'rest_base'    => array(
				'description' => __( 'The REST API base slug.', 'gutenberg' ),
				'type'        => array( 'string', 'boolean', 'null' ),
			),
			'show_ui'      => array(
				'description' => __( 'Whether to show a UI for the entity.', 'gutenberg' ),
				'type'        => 'boolean',
			),
			'show_in_menu' => array(
				'description' => __( 'Whether to show in the admin menu.', 'gutenberg' ),
				'type'        => array( 'boolean', 'string' ),
			),
			'rewrite'      => array(
				'description' => __( 'Rewrite configuration.', 'gutenberg' ),
				'type'        => array( 'object', 'boolean' ),
			),
			'supports'     => array(
				'description' => __( 'Post type features (post types only).', 'gutenberg' ),
				'type'        => 'object',
			),
			'has_archive'  => array(
				'description' => __( 'Whether the post type has an archive (post types only).', 'gutenberg' ),
				'type'        => array( 'boolean', 'string' ),
			),
			'menu_icon'    => array(
				'description' => __( 'The dashicon or URL for the menu icon (post types only).', 'gutenberg' ),
				'type'        => array( 'string', 'null' ),
			),
			'menu_position' => array(
				'description' => __( 'The menu position (post types only).', 'gutenberg' ),
				'type'        => array( 'integer', 'null' ),
			),
			'taxonomies'   => array(
				'description' => __( 'Taxonomies associated with the post type (post types only).', 'gutenberg' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
			),
			'object_type'  => array(
				'description' => __( 'Post types this taxonomy is associated with (taxonomies only).', 'gutenberg' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
			),
		);
	}

	/**
	 * Gets the arguments for updating an entity config.
	 *
	 * Same as create except slug and entity_type are not required (they come from the URL).
	 *
	 * @return array The update arguments.
	 */
	private function get_update_item_args() {
		$args = $this->get_create_item_args();
		unset( $args['entity_type'] );
		unset( $args['slug'] );

		// Nothing is required for updates.
		foreach ( $args as &$arg ) {
			unset( $arg['required'] );
		}

		return $args;
	}

	/**
	 * Retrieves the entity config schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'entity-config',
			'type'       => 'object',
			'properties' => array(
				'slug'          => array(
					'description' => __( 'The entity slug.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
				),
				'entity_type'   => array(
					'description' => __( 'The entity type (post_type or taxonomy).', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array( 'post_type', 'taxonomy' ),
					'context'     => array( 'view', 'edit' ),
				),
				'_user_created' => array(
					'description' => __( 'Whether this entity was created by a user.', 'gutenberg' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'labels'        => array(
					'description' => __( 'The entity labels.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
				),
				'description'   => array(
					'description' => __( 'A description of the entity.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
				),
				'public'        => array(
					'description' => __( 'Whether the entity is public.', 'gutenberg' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
				'hierarchical'  => array(
					'description' => __( 'Whether the entity is hierarchical.', 'gutenberg' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
				'show_in_rest'  => array(
					'description' => __( 'Whether the entity is exposed via REST API.', 'gutenberg' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
				'show_ui'       => array(
					'description' => __( 'Whether the entity has a UI.', 'gutenberg' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
			),
		);

		return $this->add_additional_fields_schema( $this->schema );
	}
}
