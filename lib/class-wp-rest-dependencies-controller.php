<?php
/**
 * Dependencies controller.
 *
 * @package gutenberg
 */

/**
 * Extendable dependency class.
 *
 * Class WP_REST_Dependencies_Controller
 *
 * @see WP_REST_Controller
 */
class WP_REST_Dependencies_Controller extends WP_REST_Controller {

	/**
	 * Dependencies core object.
	 *
	 * @var Object
	 */
	protected $object;


	/**
	 * $editor_block_dependency
	 *
	 * @var string
	 */
	protected $editor_block_dependency = '';


	/**
	 * $block_dependency
	 *
	 * @var string
	 */
	protected $block_dependency = '';

	/**
	 * Register routes.
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
				'schema' => array( $this, 'get_item_schema' ),
			)
		);

		$get_item_args = array(
			'context' => $this->get_context_param( array( 'default' => 'view' ) ),
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<handle>[\w-]+)',
			array(
				'args'   => array(
					'handle' => array(
						'description' => __( 'Unique identifier for the object.', 'gutenberg' ),
						'type'        => 'string',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => $get_item_args,
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Get list of dependencies.
	 *
	 * @param WP_REST_Request $request Request.
	 *
	 * @return array|WP_Error|WP_REST_Response
	 */
	public function get_items( $request ) {
		$data   = array();
		$handle = $request['dependency'];
		$filter = array();
		if ( $handle ) {
			$this->object->all_deps( $handle );
			$filter = $this->object->to_do;
		}

		if ( $handle ) {
			foreach ( $filter as $dependency_handle ) {
				foreach ( $this->object->registered as $dependency ) {
					if ( $dependency_handle === $dependency->handle ) {
						$item   = $this->prepare_item_for_response( $dependency, $request );
						$data[] = $this->prepare_response_for_collection( $item );
					}
				}
			}
		} else {
			foreach ( $this->object->registered as $dependency ) {
				$item   = $this->prepare_item_for_response( $dependency, $request );
				$data[] = $this->prepare_response_for_collection( $item );
			}
		}

		return $data;
	}

	/**
	 * Get a single dependency.
	 *
	 * @param WP_REST_Request $request Request.
	 *
	 * @return array|mixed|WP_Error|WP_REST_Response
	 */
	public function get_item( $request ) {
		if ( ! isset( $this->object->registered[ $request['handle'] ] ) ) {
			return array();
		}
		$dependency = $this->object->registered[ $request['handle'] ];
		$data       = $this->prepare_item_for_response( $dependency, $request );

		return $data;
	}

	/**
	 * Prepare item for response.
	 *
	 * @param mixed           $dependency Dependency.
	 * @param WP_REST_Request $request Request.
	 *
	 * @return mixed|WP_Error|WP_REST_Response
	 */
	public function prepare_item_for_response( $dependency, $request ) {
		$dependency->url = $this->get_url( $dependency->src, $dependency->ver, $dependency->handle );
		$response        = rest_ensure_response( (array) $dependency );
		$dependencies    = $this->prepare_links( $dependency );
		$response->add_links( $dependencies );

		return $response;
	}

	/**
	 * Permission check.
	 *
	 * @param WP_REST_Request $request Request.
	 *
	 * @return bool|true|WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		if ( $this->check_handle( $request['dependency'] ) ) {
			return true;
		}

		return current_user_can( 'manage_options' );
	}

	/**
	 * Permission check.
	 *
	 * @param WP_REST_Request $request Request.
	 *
	 * @return bool|true|WP_Error
	 */
	public function get_item_permissions_check( $request ) {
		if ( $this->check_handle( $request['handle'] ) ) {
			return true;
		}

		return current_user_can( 'manage_options' );
	}

	/**
	 * Prepare links.
	 *
	 * @param object $dependency Dependency.
	 *
	 * @return array
	 */
	protected function prepare_links( $dependency ) {
		$base = sprintf( '%s/%s', $this->namespace, $this->rest_base );
		// Entity meta.
		$links = array(
			'self'       => array(
				'href' => rest_url( trailingslashit( $base ) . $dependency->handle ),
			),
			'collection' => array(
				'href' => rest_url( $base ),
			),
			'deps'       => array(
				'href' => rest_url( trailingslashit( $base ) . '?dependency=' . $dependency->handle ),
			),
		);

		return $links;
	}

	/**
	 * Get collection params.
	 *
	 * @return array
	 */
	public function get_collection_params() {
		$query_params                       = parent::get_collection_params();
		$query_params['context']['default'] = 'view';

		$query_params['dependency'] = array(
			'description' => __( 'Dependency.', 'gutenberg' ),
			'type'        => 'string',
		);

		return $query_params;
	}

	/**
	 * Check handle exists and is viewable.
	 *
	 * @param string $handle script / style handle.
	 *
	 * @return bool
	 */
	protected function check_handle( $handle ) {

		if ( ! $handle ) {
			return false;
		}

		// All core assets should be public.
		if ( in_array( $handle, $this->get_core_assets(), true ) ) {
			return true;
		}

		// All block public assets should also be public.
		if ( in_array( $handle, $this->block_asset( $this->block_dependency ), true ) ) {
			return true;
		}

		// All block edit assets should check if user is logged in and has the ability to using the editor.
		if ( in_array( $handle, $this->block_asset( $this->editor_block_dependency ), true ) ) {
			return current_user_can( 'edit_posts' );
		}

		return false;
	}

	/**
	 * Get core assets.
	 *
	 * @return array
	 */
	public function get_core_assets() {
		/* translators: %s: Method name. */
		_doing_it_wrong( sprintf( __( "Method '%s' not implemented. Must be overridden in subclass.", 'gutenberg' ), __METHOD__ ), 'x.x' );

		return array();
	}

	/**
	 * Block asset.
	 *
	 * @param string $field Field to pluck from list of objects.
	 *
	 * @return array
	 */
	protected function block_asset( $field ) {
		if ( ! $field ) {
			return array();
		}

		$block_registry = WP_Block_Type_Registry::get_instance();
		$blocks         = $block_registry->get_all_registered();
		$handles        = wp_list_pluck( $blocks, $field );
		$handles        = array_values( $handles );
		$handles        = array_filter( $handles );

		return $handles;
	}

}
