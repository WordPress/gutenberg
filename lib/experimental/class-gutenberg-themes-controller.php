<?php
/**
 * REST API: Gutenberg_Themes_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 */

/**
 * Core class used to manage themes via the REST API.
 *
 * @see WP_REST_Controller
 */
class Gutenberg_Themes_Controller extends WP_REST_Themes_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();
		$this->namespace = '__experimental';
	}

	/**
	 * Registers the routes for the theme controller.
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
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => array(
						'stylesheet' => array(
							'description'       => __( "The theme's stylesheet. This uniquely identifies the theme.", 'gutenberg' ),
							'type'              => 'string',
							'sanitize_callback' => array( $this, '_sanitize_stylesheet_callback' ),
						),
						'status'     => array(
							'description' => __( 'The theme activation status.', 'gutenberg' ),
							'type'        => 'string',
							'enum'        => array( 'inactive', 'active' ),
							'default'     => 'inactive',
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			sprintf( '/%s/(?P<stylesheet>%s)', $this->rest_base, self::PATTERN ),
			array(
				'args'   => array(
					'stylesheet' => array(
						'description'       => __( "The theme's stylesheet. This uniquely identifies the theme.", 'gutenberg' ),
						'type'              => 'string',
						'sanitize_callback' => array( $this, '_sanitize_stylesheet_callback' ),
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
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
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Retrieves a single theme.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$wp_theme = $this->get_theme_data( $request['stylesheet'] );
		if ( is_wp_error( $wp_theme ) ) {
			return $wp_theme;
		}
		$data = $this->prepare_item_for_response( $wp_theme, $request );

		return rest_ensure_response( $data );
	}


	/**
	 * Retrieves a collection of themes.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$themes = array();

		$active_themes = wp_get_themes();
		$status        = $request['status'];

		foreach ( $active_themes as $theme_name => $theme ) {
			$theme_status = $this->get_theme_status( $theme_name );
			if ( is_array( $status ) && ! in_array( $theme_status, $status, true ) ) {
				continue;
			}

			$prepared = $this->prepare_item_for_response( $theme, $request );
			$themes[] = $this->prepare_response_for_collection( $prepared );
		}

		$response = rest_ensure_response( $themes );

		$response->header( 'X-WP-Total', count( $themes ) );
		$response->header( 'X-WP-TotalPages', 1 );

		return $response;
	}

	/**
	 * Uploads a theme and optionally activates it.
	 *
	 * @global WP_Filesystem_Base $wp_filesystem WordPress filesystem subclass.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		global $wp_filesystem;

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		include_once ABSPATH . 'wp-admin/includes/theme.php';

		$stylesheet = $request['stylesheet'];

		// Verify filesystem is accessible first.
		$filesystem_available = $this->is_filesystem_available();
		if ( is_wp_error( $filesystem_available ) ) {
			return $filesystem_available;
		}

		$api = themes_api(
			'theme_information',
			array(
				'slug'   => $stylesheet,
				'fields' => array(
					'sections'       => false,
					'language_packs' => true,
				),
			)
		);

		if ( is_wp_error( $api ) ) {
			if ( false !== strpos( $api->get_error_message(), 'Plugin not found.' ) ) {
				$api->add_data( array( 'status' => 404 ) );
			} else {
				$api->add_data( array( 'status' => 500 ) );
			}

			return $api;
		}

		$skin     = new WP_Ajax_Upgrader_Skin();
		$upgrader = new Theme_Upgrader( $skin );

		$result = $upgrader->install( $api->download_link );

		if ( is_wp_error( $result ) ) {
			$result->add_data( array( 'status' => 500 ) );

			return $result;
		}

		// This should be the same as $result above.
		if ( is_wp_error( $skin->result ) ) {
			$skin->result->add_data( array( 'status' => 500 ) );

			return $skin->result;
		}

		if ( $skin->get_errors()->has_errors() ) {
			$error = $skin->get_errors();
			$error->add_data( array( 'status' => 500 ) );

			return $error;
		}

		if ( is_null( $result ) ) {
			// Pass through the error from WP_Filesystem if one was raised.
			if ( $wp_filesystem instanceof WP_Filesystem_Base && is_wp_error( $wp_filesystem->errors ) && $wp_filesystem->errors->has_errors() ) {
				return new WP_Error(
					'unable_to_connect_to_filesystem',
					$wp_filesystem->errors->get_error_message(),
					array( 'status' => 500 )
				);
			}

			return new WP_Error(
				'unable_to_connect_to_filesystem',
				__( 'Unable to connect to the filesystem. Please confirm your credentials.', 'gutenberg' ),
				array( 'status' => 500 )
			);
		}

		$file = $upgrader->theme_info();

		if ( ! $file ) {
			return new WP_Error(
				'unable_to_determine_installed_plugin',
				__( 'Unable to determine what theme was installed.', 'gutenberg' ),
				array( 'status' => 500 )
			);
		}

		if ( 'inactive' !== $request['status'] && current_user_can( 'switch_themes' ) ) {
			$changed_status = $this->handle_theme_status( $file, $request['status'], 'inactive' );

			if ( is_wp_error( $changed_status ) ) {
				return $changed_status;
			}
		}

		// Install translations.
		$installed_locales = array_values( get_available_languages() );
		/** This filter is documented in wp-includes/update.php */
		$installed_locales = apply_filters( 'themes_update_check_locales', $installed_locales );

		$language_packs = array_map(
			static function( $item ) {
				return (object) $item;
			},
			$api->language_packs
		);

		$language_packs = array_filter(
			$language_packs,
			static function( $pack ) use ( $installed_locales ) {
				return in_array( $pack->language, $installed_locales, true );
			}
		);

		if ( $language_packs ) {
			$lp_upgrader = new Language_Pack_Upgrader( $skin );

			// Install all applicable language packs for the plugin.
			$lp_upgrader->bulk_upgrade( $language_packs );
		}

		$data = $this->get_theme_data( $stylesheet );

		$response = $this->prepare_item_for_response( $data, $request );
		$response->set_status( 201 );
		$response->header( 'Location', rest_url( sprintf( '%s/%s/%s', $this->namespace, $this->rest_base, substr( $file, 0, - 4 ) ) ) );

		return $response;
	}

	/**
	 * Checks if a given request has access to upload themes.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		if ( ! current_user_can( 'install_themes' ) ) {
			return new WP_Error(
				'rest_cannot_install_theme',
				__( 'Sorry, you are not allowed to install themes on this site.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( 'inactive' !== $request['status'] && ! current_user_can( 'switch_themes' ) ) {
			return new WP_Error(
				'rest_cannot_activate_theme',
				__( 'Sorry, you are not allowed to activate themes.', 'gutenberg' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}

		return true;
	}

	/**
	 * Updates one theme.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$wp_theme = $this->get_theme_data( $request['stylesheet'] );
		if ( is_wp_error( $wp_theme ) ) {
			return $wp_theme;
		}

		$status = $this->get_theme_status( $request['stylesheet'] );

		if ( $request['status'] && $status !== $request['status'] ) {
			$handled = $this->handle_theme_status( $request['stylesheet'], $request['status'], $status );

			if ( is_wp_error( $handled ) ) {
				return $handled;
			}
		}

		$this->update_additional_fields_for_object( $wp_theme, $request );

		$request['context'] = 'edit';

		return $this->prepare_item_for_response( $wp_theme, $request );
	}

	/**
	 * Checks if a given request has access to update a specific theme.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to update the item, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( current_user_can( 'switch_themes' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_cannot_manage_themes',
			__( 'Sorry, you are not allowed to manage themes for this site.', 'gutenberg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}


	/**
	 * Deletes one plugin from the site.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/theme.php';

		$data = $this->get_theme_data( $request['stylesheet'] );

		if ( is_wp_error( $data ) ) {
			return $data;
		}

		// Verify filesystem is accessible first.
		$filesystem_available = $this->is_filesystem_available();
		if ( is_wp_error( $filesystem_available ) ) {
			return $filesystem_available;
		}

		$prepared = $this->prepare_item_for_response( $data, $request );
		$deleted  = delete_theme( $request['stylesheet'] );

		if ( is_wp_error( $deleted ) ) {
			$deleted->add_data( array( 'status' => 500 ) );

			return $deleted;
		}

		return new WP_REST_Response(
			array(
				'deleted'  => true,
				'previous' => $prepared->get_data(),
			)
		);
	}

	/**
	 * Determine if the endpoints are available.
	 *
	 * Only the 'Direct' filesystem transport, and SSH/FTP when credentials are stored are supported at present.
	 *
	 * @return true|WP_Error True if filesystem is available, WP_Error otherwise.
	 */
	protected function is_filesystem_available() {
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

		return new WP_Error( 'fs_unavailable', __( 'The filesystem is currently unavailable for managing plugins.', 'gutenberg' ), array( 'status' => 500 ) );
	}

	/**
	 * Checks if a given request has access to delete a specific theme.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to delete the item, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'delete_themes' ) ) {
			return new WP_Error(
				'rest_cannot_delete_themes',
				__( 'Sorry, you are not allowed to delete themes for this site.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Handle updating a theme's status.
	 *
	 * @param string $stylesheet The theme to update.
	 * @param string $new_status The theme's new status.
	 * @param string $current_status The plugin's current status.
	 *
	 * @return boolean
	 */
	protected function handle_theme_status( $stylesheet, $new_status, $current_status ) {
		if ( 'inactive' === $new_status ) {
			$default = wp_get_theme( WP_DEFAULT_THEME );
			if ( $default->exists() ) {
				switch_theme( WP_DEFAULT_THEME );

				return true;
			}

			return false;
		}

		if ( 'active' === $new_status && 'inactive' === $current_status ) {
			$wp_theme = wp_get_theme( $stylesheet );
			if ( $wp_theme->exists() ) {
				switch_theme( $stylesheet );

				return true;
			}

			return false;
		}

		return true;
	}

	/**
	 * Get's the activation status for a theme.
	 *
	 * @param string $stylesheet The theme to check.
	 * @return string Either 'network-active', 'active' or 'inactive'.
	 */
	protected function get_theme_status( $stylesheet ) {
		$current_theme = wp_get_theme();
		$theme         = $this->get_theme_data( $stylesheet );
		if ( is_wp_error( $theme ) ) {
			return $theme;
		}

		return ( $this->is_same_theme( $theme, $current_theme ) ) ? 'active' : 'inactive';
	}

	/**
	 * Gets the theme.
	 *
	 * @param string $stylesheet The theme to get.
	 *
	 * @return WP_Theme|WP_Error The plugin data, or a WP_Error if the plugin is not installed.
	 */
	protected function get_theme_data( $stylesheet ) {
		$wp_theme = wp_get_theme( $stylesheet );
		if ( ! $wp_theme->exists() ) {
			return new WP_Error(
				'rest_theme_not_found',
				__( 'Theme not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		return $wp_theme;
	}

	/**
	 * Retrieves the search params for the themes collection.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params = parent::get_collection_params();

		$query_params['status'] = array(
			'description'       => __( 'Limit result set to themes assigned one or more statuses.', 'gutenberg' ),
			'type'              => 'array',
			'items'             => array(
				'enum' => array( 'inactive', 'active' ),
				'type' => 'string',
			),
			'sanitize_callback' => array( $this, 'sanitize_theme_status' ),
		);

		/**
		 * Filter collection parameters for the themes controller.
		 *
		 * @param array $query_params JSON Schema-formatted collection parameters.
		 */
		return apply_filters( 'rest_themes_collection_params', $query_params );
	}
}
