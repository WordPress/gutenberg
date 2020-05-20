<?php
/**
 * Start: Include for phase 2
 * Block Directory REST API: WP_REST_Block_Directory_Controller class
 *
 * @package gutenberg
 * @since 6.5.0
 */

/**
 * Controller which provides REST endpoint for the blocks.
 *
 * @since 6.5.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_Block_Directory_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'block-directory';
	}

	/**
	 * Registers the necessary REST API routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/search',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'args'                => array(
					'term' => array(
						'required' => true,
					),
				),
				'schema'              => array( $this, 'get_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/install',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'install_block' ),
				'permission_callback' => array( $this, 'install_items_permissions_check' ),
				'args'                => array(
					'slug' => array(
						'required' => true,
					),
				),
				'schema'              => array( $this, 'get_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/uninstall',
			array(
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'uninstall_block' ),
				'permission_callback' => array( $this, 'delete_items_permissions_check' ),
				'args'                => array(
					'slug' => array(
						'required' => true,
					),
				),
				'schema'              => array( $this, 'get_item_schema' ),
			)
		);
	}

	/**
	 * Checks whether a given request has permission to install and activate plugins.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|bool True if the request has permission, WP_Error object otherwise.
	 * phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! current_user_can( 'install_plugins' ) || ! current_user_can( 'activate_plugins' ) ) {
			return new WP_Error(
				'rest_user_cannot_view',
				__( 'Sorry, you are not allowed to install blocks.', 'gutenberg' )
			);
		}

		return true;
	}
	/* phpcs:enable */

	/**
	 * Checks whether a given request has permission to install and activate plugins.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|bool True if the request has permission, WP_Error object otherwise.
	 */
	public function install_items_permissions_check( $request ) {
		$plugin = $request->get_param( 'slug' );

		if (
			! current_user_can( 'install_plugins' ) ||
			! current_user_can( 'activate_plugins' ) ||
			! current_user_can( 'activate_plugin', $plugin )
		) {
			return new WP_Error(
				'rest_user_cannot_view',
				__( 'Sorry, you are not allowed to install blocks.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Checks whether a given request has permission to remove/deactivate plugins.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|bool True if the request has permission, WP_Error object otherwise.
	 */
	public function delete_items_permissions_check( $request ) {
		$plugin = $request->get_param( 'slug' );

		if (
			! current_user_can( 'delete_plugins' ) ||
			! current_user_can( 'deactivate_plugins' ) ||
			! current_user_can( 'deactivate_plugin', $plugin )
		) {
			return new WP_Error(
				'rest_user_cannot_delete',
				__( 'Sorry, you are not allowed to uninstall blocks.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Installs and activates a plugin
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function install_block( $request ) {

		include_once( ABSPATH . 'wp-admin/includes/file.php' );
		include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
		include_once( ABSPATH . 'wp-admin/includes/class-wp-upgrader.php' );
		include_once( ABSPATH . 'wp-admin/includes/plugin-install.php' );

		$slug = $request->get_param( 'slug' );

		// Verify filesystem is accessible first.
		$filesystem_available = self::is_filesystem_available();
		if ( is_wp_error( $filesystem_available ) ) {
			return $filesystem_available;
		}

		$api = plugins_api(
			'plugin_information',
			array(
				'slug'   => $slug,
				'fields' => array(
					'sections' => false,
				),
			)
		);

		if ( is_wp_error( $api ) ) {
			$api->add_data( array( 'status' => 500 ) );
			return $api;
		}

		$skin     = new WP_Ajax_Upgrader_Skin();
		$upgrader = new Plugin_Upgrader( $skin );

		$result = $upgrader->install( $api->download_link );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// This should be the same as $result above.
		if ( is_wp_error( $skin->result ) ) {
			return $skin->result;
		}

		if ( $skin->get_errors()->has_errors() ) {
			return $skin->get_errors();
		}

		if ( is_null( $result ) ) {
			global $wp_filesystem;
			// Pass through the error from WP_Filesystem if one was raised.
			if ( $wp_filesystem instanceof WP_Filesystem_Base && is_wp_error( $wp_filesystem->errors ) && $wp_filesystem->errors->has_errors() ) {
				return new WP_Error( 'unable_to_connect_to_filesystem', esc_html( $wp_filesystem->errors->get_error_message() ), array( 'status' => 500 ) );
			}
			return new WP_Error( 'unable_to_connect_to_filesystem', __( 'Unable to connect to the filesystem. Please confirm your credentials.', 'gutenberg' ), array( 'status' => 500 ) );
		}

		// Find the plugin to activate it.
		$plugin_files = get_plugins( '/' . $slug );
		$plugin_files = array_keys( $plugin_files );

		$plugin_file = $slug . '/' . reset( $plugin_files );

		activate_plugin( $plugin_file );

		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Deactivates and deletes a plugin
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function uninstall_block( $request ) {

		include_once( ABSPATH . 'wp-admin/includes/file.php' );
		include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
		include_once( ABSPATH . 'wp-admin/includes/class-wp-upgrader.php' );
		include_once( ABSPATH . 'wp-admin/includes/plugin-install.php' );

		$slug = trim( $request->get_param( 'slug' ) );

		if ( ! $slug ) {
			return new WP_Error( 'slug_not_provided', 'Valid slug not provided.', array( 'status' => 400 ) );
		}

		// Verify filesystem is accessible first.
		$filesystem_available = self::is_filesystem_available();
		if ( is_wp_error( $filesystem_available ) ) {
			return $filesystem_available;
		}

		$plugin_files = get_plugins( '/' . $slug );

		if ( ! $plugin_files ) {
			return new WP_Error( 'block_not_found', 'Valid slug not provided.', array( 'status' => 400 ) );
		}

		$plugin_files = array_keys( $plugin_files );
		$plugin_file  = $slug . '/' . reset( $plugin_files );

		deactivate_plugins( $plugin_file );

		$delete_result = delete_plugins( array( $plugin_file ) );

		if ( is_wp_error( $delete_result ) ) {
			return $delete_result;
		}

		return rest_ensure_response( true );
	}

	/**
	 * Search and retrieve blocks metadata
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {

		$search_string = trim( $request->get_param( 'term' ) );

		if ( empty( $search_string ) ) {
			return rest_ensure_response( array() );
		}

		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		$response = plugins_api(
			'query_plugins',
			array(
				'block'    => $search_string,
				'per_page' => 3,
			)
		);

		if ( is_wp_error( $response ) ) {
			$response->add_data( array( 'status' => 500 ) );
			return $response;
		}

		$result = array();

		foreach ( $response->plugins as $plugin ) {
			$installed_plugins = get_plugins( '/' . $plugin['slug'] );

			// Only show uninstalled blocks.
			if ( empty( $installed_plugins ) ) {
				$data = $this->prepare_item_for_response( $plugin, $request );
				$result[] = $this->prepare_response_for_collection( $data );
			}
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Determine if the endpoints are available.
	 *
	 * Only the 'Direct' filesystem transport, and SSH/FTP when credentials are stored are supported at present.
	 *
	 * @since 6.5.0
	 *
	 * @return bool|WP_Error True if filesystem is available, WP_Error otherwise.
	 */
	private static function is_filesystem_available() {
		$filesystem_method = get_filesystem_method();

		if ( 'direct' === $filesystem_method ) {
			return true;
		}

		ob_start();
		$filesystem_credentials_are_stored = request_filesystem_credentials( self_admin_url() );
		ob_end_clean();

		if ( $filesystem_credentials_are_stored ) {
			return true;
		}

		return new WP_Error( 'fs_unavailable', __( 'The filesystem is currently unavailable for installing blocks.' ) );
	}

	/**
	 * Parse block metadata for a block, and prepare it for an API repsonse.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_Object $plugin The plugin metadata.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function prepare_item_for_response( $plugin, $request ) {

		// There might be multiple blocks in a plugin. Only the first block is mapped.
		$block_data   = reset( $plugin['blocks'] );

		// A data array containing the properties we'll return.
		$block = array(
			'name'                  => $block_data['name'],
			'title'                 => ( $block_data['title'] ? $block_data['title'] : $plugin['name'] ),
			'description'           => wp_trim_words( $plugin['description'], 30, '...' ),
			'id'                    => $plugin['slug'],
			'rating'                => $plugin['rating'] / 20,
			'rating_count'          => intval( $plugin['num_ratings'] ),
			'active_installs'       => intval( $plugin['active_installs'] ),
			'author_block_rating'   => $plugin['author_block_rating'] / 20,
			'author_block_count'    => intval( $plugin['author_block_count'] ),
			'author'                => wp_strip_all_tags( $plugin['author'] ),
			'icon'                  => ( isset( $plugin['icons']['1x'] ) ? $plugin['icons']['1x'] : 'block-default' ),
			'assets'                => array(),
			'humanized_updated'     => sprintf(
				/* translators: %s: Human-readable time difference. */
				__( '%s ago' ),
				human_time_diff( strtotime( $plugin['last_updated'] ), current_time( 'timestamp' ) )
			),
		);

		foreach ( $plugin['block_assets'] as $asset ) {
			// TODO: Return from API, not client-set.
			$block[ 'assets' ][] = 'https://plugins.svn.wordpress.org/' . $plugin['slug'] . $asset;
		}

		$response = new WP_REST_Response( $block );

		return $response;
	}

	/**
	 * Retrieves the theme's schema, conforming to JSON Schema.
	 *
	 * @since 5.5.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'block-directory-item',
			'type'       => 'object',
			'properties' => array(
				'name'                => array(
					'description'       => __( "The block name, in namespace/block-name format." ),
					'type'              => 'string',
					'context'           => array( 'view' ),
				),
				'title'               => array(
					'description'       => __( "The block title, in human readable format." ),
					'type'              => 'string',
					'context'           => array( 'view' ),
				),
				'description'         => array(
					'description'       => __( "A short description of the block, in human readable format." ),
					'type'              => 'string',
					'context'           => array( 'view' ),
				),
				'id'                  => array(
					'description'       => __( "The block slug." ),
					'type'              => 'string',
					'context'           => array( 'view' ),
				),
				'rating'              => array(
					'description'       => __( "The star rating of the block." ),
					'type'              => 'integer',
					'context'           => array( 'view' ),
				),
				'rating_count'        => array(
					'description'       => __( "The number of ratings." ),
					'type'              => 'integer',
					'context'           => array( 'view' ),
				),
				'active_installs'     => array(
					'description'       => __( "The number sites that have activated this block." ),
					'type'              => 'string',
					'context'           => array( 'view' ),
				),
				'author_block_rating' => array(
					'description'       => __( "The average rating of blocks published by the same author." ),
					'type'              => 'integer',
					'context'           => array( 'view' ),
				),
				'author_block_count'  => array(
					'description'       => __( "The number of blocks published by the same author." ),
					'type'              => 'integer',
					'context'           => array( 'view' ),
				),
				'author'              => array(
					'description'       => __( "The WordPress.org username of the block author." ),
					'type'              => 'string',
					'context'           => array( 'view' ),
				),
				'icon' => array(
					'description'     => __( "The block icon." ),
					'type'              => 'string',
					'format'            => 'uri',
					'context'           => array( 'view' ),
				),
				'humanized_updated'   => array(
					'description'       => __( "The date when the block was last updated, in fuzzy human readable format." ),
					'type'              => 'string',
					'context'           => array( 'view' ),
				),
				'assets'              => array(
					'description'       => __( 'An object representing the block CSS and JavaScript assets.' ),
					'type'              => 'array',
					'context'           => array( 'view' ),
					'readonly'          => true,
					'items'             => array(
						'type'            => 'string',
						'format'          => 'uri',
					),

				),

			),
		);

		return $this->schema;
	}


	/**
	 * Retrieves the search params for the blocks collection.
	 *
	 * @since 5.5.0
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params = parent::get_collection_params();

		$query_params['term'] = array(
			'description'       => __( 'Limit result set to blocks matching the search term.' ),
			'type'              => 'array',
			'term'             => array(
				'type' => 'string',
			),
			'required'          => true,
		);

		/**
		 * Filter collection parameters for the block directory controller.
		 *
		 * @since 5.0.0
		 *
		 * @param array $query_params JSON Schema-formatted collection parameters.
		 */
		return apply_filters( 'rest_block_directory_collection_params', $query_params );
	}

}
