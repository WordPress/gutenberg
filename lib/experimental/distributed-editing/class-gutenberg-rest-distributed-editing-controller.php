<?php
/**
 * Gutenberg_REST_Distributed_Editing_Controller class
 *
 * REST surface for the distributed editing prototype. All decisions live in
 * Gutenberg_Distributed_Editing_Engine; this controller only maps HTTP to it.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'Gutenberg_REST_Distributed_Editing_Controller' ) ) {

	/**
	 * REST controller for distributed-editing state and standalone saves.
	 *
	 * @access private
	 */
	class Gutenberg_REST_Distributed_Editing_Controller {
		/**
		 * REST API namespace.
		 *
		 * @var string
		 */
		const REST_NAMESPACE = 'gutenberg-de/v1';

		/**
		 * Engine instance.
		 *
		 * @var Gutenberg_Distributed_Editing_Engine
		 */
		private $engine;

		/**
		 * Constructor.
		 */
		public function __construct() {
			$this->engine = new Gutenberg_Distributed_Editing_Engine();
		}

		/**
		 * Registers REST API routes.
		 */
		public function register_routes(): void {
			register_rest_route(
				self::REST_NAMESPACE,
				'/posts/(?P<id>[\d]+)/state',
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_state' ),
					'permission_callback' => array( $this, 'check_edit_permission' ),
				)
			);

			register_rest_route(
				self::REST_NAMESPACE,
				'/posts/(?P<id>[\d]+)/save',
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save' ),
					'permission_callback' => array( $this, 'check_edit_permission' ),
					'args'                => array(
						'content'      => array(
							'required'  => true,
							'type'      => 'string',
							'maxLength' => Gutenberg_Distributed_Editing_Engine::MAX_CONTENT_LENGTH,
						),
						'base_version' => array(
							'required' => true,
							'type'     => 'string',
						),
						'approvals'    => array(
							'required' => false,
							'type'     => 'array',
							'items'    => array( 'type' => 'string' ),
							'default'  => array(),
						),
					),
				)
			);
		}

		/**
		 * Checks that the current user can edit the target post.
		 *
		 * @param WP_REST_Request $request The REST request.
		 * @return bool|WP_Error True if permitted.
		 */
		public function check_edit_permission( WP_REST_Request $request ) {
			$post_id = (int) $request['id'];
			if ( ! current_user_can( 'edit_post', $post_id ) ) {
				return new WP_Error(
					'rest_cannot_edit',
					__( 'You do not have permission to edit this post.', 'gutenberg' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
			return true;
		}

		/**
		 * Returns the accepted state of a post.
		 *
		 * @param WP_REST_Request $request The REST request.
		 * @return WP_REST_Response|WP_Error Response.
		 */
		public function get_state( WP_REST_Request $request ) {
			return rest_ensure_response( $this->engine->get_state( (int) $request['id'] ) );
		}

		/**
		 * Applies a distributed-editing save.
		 *
		 * @param WP_REST_Request $request The REST request.
		 * @return WP_REST_Response|WP_Error Response.
		 */
		public function save( WP_REST_Request $request ) {
			return rest_ensure_response(
				$this->engine->save(
					(int) $request['id'],
					(string) $request['content'],
					(string) $request['base_version'],
					(array) $request['approvals'],
					get_current_user_id()
				)
			);
		}
	}
}
