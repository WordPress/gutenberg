<?php
/**
 * Start: Include for phase 2
 * Block Directory REST API: WP_REST_Blocks_Controller class
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
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/install',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'install_block' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/uninstall',
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'uninstall_block' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);
	}

	/**
	 * Checks whether a given request has permission to install and activate plugins.
	 *
	 * @since 6.5.0
	 *
	 * @return WP_Error|bool True if the request has permission, WP_Error object otherwise.
	 */
	public function permissions_check() {
		if ( ! current_user_can( 'install_plugins' ) || ! current_user_can( 'activate_plugins' ) ) {
			return new WP_Error(
				'rest_user_cannot_view',
				__( 'Sorry, you are not allowed to install blocks.', 'gutenberg' )
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

		$api = plugins_api(
			'plugin_information',
			array(
				'slug'   => $request->get_param( 'slug' ),
				'fields' => array(
					'sections' => false,
				),
			)
		);

		if ( is_wp_error( $api ) ) {
			return WP_Error( $api->get_error_code(), $api->get_error_message() );
		}

		$skin     = new WP_Ajax_Upgrader_Skin();
		$upgrader = new Plugin_Upgrader( $skin );

		$filesystem_method = get_filesystem_method();

		if ( 'direct' !== $filesystem_method ) {
			return WP_Error( null, 'Only direct FS_METHOD is supported.' );
		}

		$result = $upgrader->install( $api->download_link );

		if ( is_wp_error( $result ) ) {
			return WP_Error( $result->get_error_code(), $result->get_error_message() );
		}

		if ( is_wp_error( $skin->result ) ) {
			return WP_Error( $skin->$result->get_error_code(), $skin->$result->get_error_message() );
		}

		if ( $skin->get_errors()->has_errors() ) {
			return WP_Error( $skin->$result->get_error_code(), $skin->$result->get_error_messages() );
		}

		if ( is_null( $result ) ) {
			global $wp_filesystem;
			// Pass through the error from WP_Filesystem if one was raised.
			if ( $wp_filesystem instanceof WP_Filesystem_Base && is_wp_error( $wp_filesystem->errors ) && $wp_filesystem->errors->has_errors() ) {
				return WP_Error( 'unable_to_connect_to_filesystem', esc_html( $wp_filesystem->errors->get_error_message() ) );
			}
			return WP_Error( 'unable_to_connect_to_filesystem', __( 'Unable to connect to the filesystem. Please confirm your credentials.', 'gutenberg' ) );
		}

		$install_status = install_plugin_install_status( $api );

		$activate_result = activate_plugin( $install_status['file'] );

		if ( is_wp_error( $activate_result ) ) {
			return WP_Error( $activate_result->get_error_code(), $activate_result->get_error_message() );
		}

		return rest_ensure_response( true );
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

		$api = plugins_api(
			'plugin_information',
			array(
				'slug'   => $request->get_param( 'slug' ),
				'fields' => array(
					'sections' => false,
				),
			)
		);

		if ( is_wp_error( $api ) ) {
			return WP_Error( $api->get_error_code(), $api->get_error_message() );
		}

		$install_status = install_plugin_install_status( $api );

		$deactivate_result = deactivate_plugins( $install_status['file'] );

		if ( is_wp_error( $deactivate_result ) ) {
			return WP_Error( $deactivate_result->get_error_code(), $deactivate_result->get_error_message() );
		}

		$delete_result = delete_plugins( array( $install_status['file'] ) );

		if ( is_wp_error( $delete_result ) ) {
			return WP_Error( $delete_result->get_error_code(), $delete_result->get_error_message() );
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

		$search_string = $request->get_param( 'term' );

		if ( empty( $search_string ) ) {
			return rest_ensure_response( array() );
		}

		include( ABSPATH . WPINC . '/version.php' );

		$url = 'http://api.wordpress.org/plugins/info/1.2/';
		$url = add_query_arg(
			array(
				'action'              => 'query_plugins',
				'request[block]'      => $search_string,
				'request[wp_version]' => '5.3',
				'request[per_page]'   => '3',
			),
			$url
		);
		$ssl = wp_http_supports( array( 'ssl' ) );
		if ( $ssl ) {
			$url = set_url_scheme( $url, 'https' );
		}

		global $wp_version;
		$http_args = array(
			'timeout'    => 15,
			'user-agent' => 'WordPress/' . $wp_version . '; ' . home_url( '/' ),
		);

		$request  = wp_remote_get( $url, $http_args );
		$response = json_decode( wp_remote_retrieve_body( $request ), true );

		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$result = array();

		foreach ( $response['plugins'] as $plugin ) {
			$installed_plugins = get_plugins( '/' . $plugin['slug'] );

			// Only show uninstalled blocks.
			if ( empty( $installed_plugins ) ) {
				$result[] = self::parse_block_metadata( $plugin );
			}
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Parse block metadata for a block
	 *
	 * @since 6.5.0
	 *
	 * @param WP_Object $plugin The plugin metadata.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	private static function parse_block_metadata( $plugin ) {
		$block = new stdClass();

		// There might be multiple blocks in a plugin. Only the first block is mapped.
		$block_data   = reset( $plugin['blocks'] );
		$block->name  = $block_data['name'];
		$block->title = $block_data['title'];

		// Plugin's description, not description in block.json.
		$block->description = wp_trim_words( wp_strip_all_tags( $plugin['description'] ), 30, '...' );

		$block->id                  = $plugin['slug'];
		$block->rating              = $plugin['rating'] / 20;
		$block->rating_count        = $plugin['num_ratings'];
		$block->active_installs     = $plugin['active_installs'];
		$block->author_block_rating = $plugin['author_block_rating'] / 20;
		$block->author_block_count  = $plugin['author_block_count'];

		// Plugin's author, not author in block.json.
		$block->author = wp_strip_all_tags( $plugin['author'] );

		// Plugin's icons or icon in block.json.
		$block->icon = isset( $plugin['icons']['1x'] ) ? $plugin['icons']['1x'] : 'block-default';

		$block->assets = array();

		foreach ( $plugin['block_assets'] as $asset ) {
			$block->assets[] = 'https://plugins.svn.wordpress.org/' . $plugin['slug'] . $asset;
		}

		$block->humanized_updated = sprintf(
			/* translators: %s: Human-readable time difference. */
			__( '%s ago', 'gutenberg' ),
			human_time_diff( strtotime( $plugin['last_updated'] ), time() )
		);

		return $block;
	}
}
