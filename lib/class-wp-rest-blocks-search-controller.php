<?php
/**
 * Start: Include for phase 2
 * Block Areas REST API: WP_REST_Blocks_Controller class
 *
 * @package gutenberg
 * @since 5.7.0
 */

/**
 * Controller which provides REST endpoint for the blocks.
 *
 * @since 5.2.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_Blocks_Search_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 *
	 * @access public
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'blocks';
	}

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @access public
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/install',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'install_block' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks whether a given request has permission to install and activate plugins.
	 *
	 * @since 5.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|bool True if the request has permission, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! ( current_user_can( 'install_plugins' ) && current_user_can( 'activate_plugins' ) ) ) {
			return new WP_Error(
				'rest_user_cannot_view',
				__( 'Sorry, you are not allowed to install blocks.', 'gutenberg' )
			);
		}

		return true;
	}

	/**
	 * Install and activate a plugin
	 *
	 * @since 5.7.0
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
				'slug'   => sanitize_key( wp_unslash( $request->get_param( 'slug' ) ) ),
				'fields' => array(
					'sections' => false,
				),
			)
		);
		if ( is_wp_error( $api ) ) {
			$status['errorMessage'] = $api->get_error_message();
			wp_send_json_error( $status );
		}
		$status['pluginName'] = $api->name;
		$skin     = new WP_Ajax_Upgrader_Skin();
		$upgrader = new Plugin_Upgrader( $skin );
		$result   = $upgrader->install( $api->download_link );
	
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			$status['debug'] = $skin->get_upgrade_messages();
		}
		if ( is_wp_error( $result ) ) {
			$status['errorCode']    = $result->get_error_code();
			$status['errorMessage'] = $result->get_error_message();
			wp_send_json_error( $status );
		} elseif ( is_wp_error( $skin->result ) ) {
			$status['errorCode']    = $skin->result->get_error_code();
			$status['errorMessage'] = $skin->result->get_error_message();
			wp_send_json_error( $status );
		} elseif ( $skin->get_errors()->has_errors() ) {
			$status['errorMessage'] = $skin->get_error_messages();
			wp_send_json_error( $status );
		} elseif ( is_null( $result ) ) {
			global $wp_filesystem;
			$status['errorCode']    = 'unable_to_connect_to_filesystem';
			$status['errorMessage'] = __( 'Unable to connect to the filesystem. Please confirm your credentials.' );
			// Pass through the error from WP_Filesystem if one was raised.
			if ( $wp_filesystem instanceof WP_Filesystem_Base && is_wp_error( $wp_filesystem->errors ) && $wp_filesystem->errors->has_errors() ) {
				$status['errorMessage'] = esc_html( $wp_filesystem->errors->get_error_message() );
			}
			wp_send_json_error( $status );
		}

		$install_status = install_plugin_install_status( $api );

		activate_plugin( $install_status['file'] );
		
		wp_send_json_success( $status );
	}

	/**
	 * Search and retrieve blocks metadata
	 *
	 * @since 5.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {

		if ( ! isset($_REQUEST[ 'search' ] ) ) {
			return rest_ensure_response( array() );
		}

		$search_string = preg_quote( $_REQUEST[ 'search' ] );

		include( ABSPATH . WPINC . '/version.php' );

		$url = 'http://api.wordpress.org/plugins/info/1.2/';
		$url = add_query_arg(
			array(
				'action'  => 'query_plugins',
				'request[block]' => $search_string,
				'request[wp_version]' => '5.3',
				'request[per_page]' => '3'
			),
			$url
		);
		$http_url = $url;
		$ssl      = wp_http_supports( array( 'ssl' ) );
		if ( $ssl ) {
			$url = set_url_scheme( $url, 'https' );
		}
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

		foreach ( $response[ 'plugins' ] as $plugin ) {
			$installed_plugins = get_plugins( '/' . $plugin[ 'slug' ] );

			// Only show uninstalled blocks.
			if ( empty( $installed_plugins ) ) {
				$result[] = parse_block_metadata( $plugin );
			}
		}

		return rest_ensure_response( $result );
	}
}

function parse_block_metadata( $plugin ) {
	$block     = new stdClass();
	$block->id = $plugin[ 'slug' ];

	// AMBIGUOUS: There might be multiple blocks. Only the first element in blocks is mapped
	$block->name  = reset( $plugin[ 'blocks' ] )[ 'name' ];
	$block->title = reset( $plugin[ 'blocks' ] )[ 'title' ];

	// AMBIGUOUS: Plugin's description, not description in block.json
	$block->description = wp_strip_all_tags( $plugin[ 'description' ] );

	$block->rating         = $plugin[ 'rating' ];
	$block->ratingCount    = $plugin[ 'num_ratings' ];
	$block->activeInstalls = $plugin[ 'active_installs' ];

	// AMBIGUOUS: Plugin's author, not author in block.json
	$block->author = wp_strip_all_tags( $plugin[ 'author' ] );

	// AMBIGUOUS: Plugin's icons or icon in block.json
	$block->icon = isset( $plugin[ 'icons' ][ '1x' ] ) ? $plugin[ 'icons' ][ '1x' ] : 'block-default';

	$block->assets = array_map( function( $asset ) use ( $plugin ) { 
		return 'https://plugins.svn.wordpress.org/' . $plugin[ 'slug' ] . $asset;
	}, $plugin[ 'block_assets' ] );

	$block->humanizedUpdated = human_time_diff( strtotime( $plugin[ 'last_updated' ] ), current_time( 'timestamp' ) ) . __( ' ago' );

	// TODO: calculate these values
	$block->authorAverageRating = null;
	$block->authorBlocksCount   = null;
	$block->authorSupportTime   = null;

	return $block;
}
