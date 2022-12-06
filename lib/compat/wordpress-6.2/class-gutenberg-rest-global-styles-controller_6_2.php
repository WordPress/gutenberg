<?php
/**
 * REST API: Gutenberg_REST_Global_Styles_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Base Global Styles REST API Controller.
 */
class Gutenberg_REST_Global_Styles_Controller_6_2 extends Gutenberg_REST_Global_Styles_Controller {
	/**
	 * Registers the controllers routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		parent::register_routes();
	}

	/**
	 * Updates a single global style config.
	 *
	 * @since 5.9.0
	 * @since 6.2.0 Added validation of styles.css property.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$post_before = $this->get_post( $request['id'] );
		if ( is_wp_error( $post_before ) ) {
			return $post_before;
		}

		$changes = $this->prepare_item_for_database( $request );
		if ( is_wp_error( $changes ) ) {
			return $changes;
		}

		$result = wp_update_post( wp_slash( (array) $changes ), true, false );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$post          = get_post( $request['id'] );
		$fields_update = $this->update_additional_fields_for_object( $post, $request );
		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}

		wp_after_insert_post( $post, true, $post_before );

		$response = $this->prepare_item_for_response( $post, $request );

		return rest_ensure_response( $response );
	}
	/**
	 * Prepares a single global styles config for update.
	 *
	 * @since 5.9.0
	 * @since 6.2.0 Added validation of styles.css property.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return stdClass Changes to pass to wp_update_post.
	 */
	protected function prepare_item_for_database( $request ) {
		$changes         = new stdClass();
		$changes->ID     = $request['id'];
		$post            = get_post( $request['id'] );
		$existing_config = array();
		if ( $post ) {
			$existing_config     = json_decode( $post->post_content, true );
			$json_decoding_error = json_last_error();
			if ( JSON_ERROR_NONE !== $json_decoding_error || ! isset( $existing_config['isGlobalStylesUserThemeJSON'] ) ||
				! $existing_config['isGlobalStylesUserThemeJSON'] ) {
				$existing_config = array();
			}
		}
		if ( isset( $request['styles'] ) || isset( $request['settings'] ) ) {
			$config = array();
			if ( isset( $request['styles'] ) ) {
				$config['styles']    = $request['styles'];
				$validate_custom_css = $this->validate_custom_css( $request['styles']['css'] );
				if ( is_wp_error( $validate_custom_css ) ) {
					return $validate_custom_css;
				}
			} elseif ( isset( $existing_config['styles'] ) ) {
				$config['styles'] = $existing_config['styles'];
			}
			if ( isset( $request['settings'] ) ) {
				$config['settings'] = $request['settings'];
			} elseif ( isset( $existing_config['settings'] ) ) {
				$config['settings'] = $existing_config['settings'];
			}
			$config['isGlobalStylesUserThemeJSON'] = true;
			$config['version']                     = WP_Theme_JSON_Gutenberg::LATEST_SCHEMA;
			$changes->post_content                 = wp_json_encode( $config );
		}
		// Post title.
		if ( isset( $request['title'] ) ) {
			if ( is_string( $request['title'] ) ) {
				$changes->post_title = $request['title'];
			} elseif ( ! empty( $request['title']['raw'] ) ) {
				$changes->post_title = $request['title']['raw'];
			}
		}
		return $changes;
	}

	/**
	 * Validate style.css as valid CSS.
	 *
	 * Currently just checks for invalid markup.
	 *
	 * @since 6.2.0
	 *
	 * @param string $css CSS to validate.
	 * @return true|WP_Error True if the input was validated, otherwise WP_Error.
	 */
	private function validate_custom_css( $css ) {
		if ( preg_match( '#</?\w+#', $css ) ) {
			return new WP_Error(
				'rest_custom_css_illegal_markup',
				__( 'Markup is not allowed in CSS.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}
		return true;
	}
}
