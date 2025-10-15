<?php
/**
 * Controller which provides REST endpoint for activating a theme.
 *
 * @package    gutenberg
 * @subpackage REST_API
 * @since 6.9.0
 */
if ( ! class_exists( 'WP_REST_Themes_Controller_Gutenberg' ) ) {

	class WP_REST_Themes_Controller_Gutenberg extends WP_REST_Themes_Controller {
		/**
		 * Registers the route for theme activation.
		 *
		 * @since 6.9.0
		 *
		 * @see register_rest_route()
		 */
		public function register_routes() {
			register_rest_route(
				$this->namespace,
				'/' . $this->rest_base . '/activate',
				array(
					array(
						'methods'             => WP_REST_Server::CREATABLE,
						'callback'            => array( $this, 'activate_theme' ),
						'permission_callback' => array( $this, 'activate_theme_permissions_check' ),
						'args'                => array(
							'stylesheet' => array(
								'description'       => __( 'Unique identifier for the theme.' ),
								'type'              => 'string',
								'required'          => true,
								'validate_callback' => array( $this, 'validate_theme' ),
							),
						),
					),
				)
			);
		}

		/**
		 * Checks if a given request has access to activate the theme.
		 *
		 * @since 6.9.0
		 *
		 * @return true|WP_Error True if the request has activate access for the item, otherwise WP_Error object.
		 */
		public function activate_theme_permissions_check() {
			if ( current_user_can( 'switch_themes' ) ) {
				return true;
			}

			return new WP_Error(
				'rest_cannot_activate_themes',
				__( 'Sorry, you are not allowed to activate themes.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		/**
		 * Validates the theme.
		 *
		 * @since 6.9.0
		 *
		 * @param string $stylesheet The stylesheet of the theme.
		 * @return true|WP_Error True if the theme is valid, otherwise WP_Error object.
		 */
		public function validate_theme( $stylesheet ) {
			$theme = wp_get_theme( $stylesheet );

			if ( ! $theme->exists() ) {
				return new WP_Error(
					'rest_theme_not_found',
					__( 'The requested theme does not exist.' ),
					array( 'status' => 404 )
				);
			}

			if ( ! $theme->is_allowed() ) {
				return new WP_Error(
					'rest_theme_not_allowed',
					__( 'The requested theme is not network enabled.' ),
					array( 'status' => 400 )
				);
			}

			return true;
		}

		/**
		 * Activates the theme.
		 *
		 * @since 6.9.0
		 *
		 * @param WP_REST_Request $request The request object.
		 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
		 */
		public function activate_theme( WP_REST_Request $request ) {
			$theme = wp_get_theme( $request['stylesheet'] );

			switch_theme( $theme->get_stylesheet() );

			return rest_ensure_response(
				array(
					'message' => __( 'Theme activated successfully.' ),
					'theme'   => $theme->get_stylesheet(),
				)
			);
		}
	}

	add_action(
		'rest_api_init',
		function () {
			( new WP_REST_Themes_Controller_Gutenberg() )->register_routes();
		}
	);
}
