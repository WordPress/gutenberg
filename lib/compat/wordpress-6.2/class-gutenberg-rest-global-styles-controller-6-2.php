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
class Gutenberg_REST_Global_Styles_Controller_6_2 extends WP_REST_Global_Styles_Controller {
	/**
	 * Registers the controllers routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		parent::register_routes();
	}

	/**
	 * Prepare a global styles config output for response.
	 *
	 * @since 5.9.0
	 * @since 6.2 Handling of style.css was added to WP_Theme_JSON.
	 *
	 * @param WP_Post         $post Global Styles post object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $post, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$raw_config                       = json_decode( $post->post_content, true );
		$is_global_styles_user_theme_json = isset( $raw_config['isGlobalStylesUserThemeJSON'] ) && true === $raw_config['isGlobalStylesUserThemeJSON'];
		$config                           = array();
		if ( $is_global_styles_user_theme_json ) {
			$config = ( new WP_Theme_JSON_Gutenberg( $raw_config, 'custom' ) )->get_raw_data();
		}

		// Base fields for every post.
		$data   = array();
		$fields = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = $post->ID;
		}

		if ( rest_is_field_included( 'title', $fields ) ) {
			$data['title'] = array();
		}
		if ( rest_is_field_included( 'title.raw', $fields ) ) {
			$data['title']['raw'] = $post->post_title;
		}
		if ( rest_is_field_included( 'title.rendered', $fields ) ) {
			add_filter( 'protected_title_format', array( $this, 'protected_title_format' ) );

			$data['title']['rendered'] = get_the_title( $post->ID );

			remove_filter( 'protected_title_format', array( $this, 'protected_title_format' ) );
		}

		if ( rest_is_field_included( 'settings', $fields ) ) {
			$data['settings'] = ! empty( $config['settings'] ) && $is_global_styles_user_theme_json ? $config['settings'] : new stdClass();
		}

		if ( rest_is_field_included( 'styles', $fields ) ) {
			$data['styles'] = ! empty( $config['styles'] ) && $is_global_styles_user_theme_json ? $config['styles'] : new stdClass();
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		if ( rest_is_field_included( '_links', $fields ) || rest_is_field_included( '_embedded', $fields ) ) {
			$links = $this->prepare_links( $post->ID );
			$response->add_links( $links );
			if ( ! empty( $links['self']['href'] ) ) {
				$actions = $this->get_available_actions();
				$self    = $links['self']['href'];
				foreach ( $actions as $rel ) {
					$response->add_link( $rel, $self );
				}
			}
		}

		return $response;
	}

	/**
	 * Get the link relations available for the post and current user.
	 *
	 * @since 5.9.0
	 * @since 6.2.0 Added 'edit-css' action.
	 *
	 * @return array List of link relations.
	 */
	protected function get_available_actions() {
		$rels = array();

		$post_type = get_post_type_object( $this->post_type );
		if ( current_user_can( $post_type->cap->publish_posts ) ) {
			$rels[] = 'https://api.w.org/action-publish';
		}

		if ( current_user_can( 'edit_css' ) ) {
			$rels[] = 'https://api.w.org/action-edit-css';
		}

		return $rels;
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
				$config['styles'] = $request['styles'];
				if ( isset( $request['styles']['css'] ) ) {
					$validate_custom_css = $this->validate_custom_css( $request['styles']['css'] );
					if ( is_wp_error( $validate_custom_css ) ) {
						return $validate_custom_css;
					}
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

	/**
	 * Returns the given theme global styles config.
	 * Duplicated from core.
	 * The only change is that we call WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( 'theme' ) instead of WP_Theme_JSON_Resolver::get_merged_data( 'theme' ).
	 *
	 * @since 6.2.0
	 *
	 * @param WP_REST_Request $request The request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_theme_item( $request ) {
		if ( get_stylesheet() !== $request['stylesheet'] ) {
			// This endpoint only supports the active theme for now.
			return new WP_Error(
				'rest_theme_not_found',
				__( 'Theme not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$theme  = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( 'theme' );
		$data   = array();
		$fields = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'settings', $fields ) ) {
			$data['settings'] = $theme->get_settings();
		}

		if ( rest_is_field_included( 'styles', $fields ) ) {
			$raw_data       = $theme->get_raw_data();
			$data['styles'] = isset( $raw_data['styles'] ) ? $raw_data['styles'] : array();
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		$response = rest_ensure_response( $data );

		if ( rest_is_field_included( '_links', $fields ) || rest_is_field_included( '_embedded', $fields ) ) {
			$links = array(
				'self' => array(
					'href' => rest_url( sprintf( '%s/%s/themes/%s', $this->namespace, $this->rest_base, $request['stylesheet'] ) ),
				),
			);
			$response->add_links( $links );
		}

		return $response;
	}

	/**
	 * Returns the given theme global styles variations.
	 *
	 * @since 6.0.0
	 * @since 6.2.0 Returns parent theme variations, if they exist.
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_theme_items( $request ) {
		if ( get_stylesheet() !== $request['stylesheet'] ) {
			// This endpoint only supports the active or parent theme for now.
			return new WP_Error(
				sprintf( '%s', $request['template'] ),
				__( 'Theme not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$variations = WP_Theme_JSON_Resolver_Gutenberg::get_style_variations();
		$response   = rest_ensure_response( $variations );

		return $response;
	}
}
