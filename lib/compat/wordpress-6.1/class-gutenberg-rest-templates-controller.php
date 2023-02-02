<?php
/**
 * REST API: Gutenberg_REST_Templates_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Base Templates REST API Controller.
 */
class Gutenberg_REST_Templates_Controller extends WP_REST_Templates_Controller {

	/**
	 * Registers the controllers routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		// Get fallback template content.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/lookup',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_template_fallback' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'slug'            => array(
							'description' => __( 'The slug of the template to get the fallback for', 'gutenberg' ),
							'type'        => 'string',
							'required'    => true,
						),
						'is_custom'       => array(
							'description' => __( 'Indicates if a template is custom or part of the template hierarchy', 'gutenberg' ),
							'type'        => 'boolean',
						),
						'template_prefix' => array(
							'description' => __( 'The template prefix for the created template. This is used to extract the main template type ex. in `taxonomy-books` we extract the `taxonomy`', 'gutenberg' ),
							'type'        => 'string',
						),
					),
				),
			)
		);
		parent::register_routes();
	}

	/**
	 * Returns the fallback template for a given slug.
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_template_fallback( $request ) {
		$hierarchy         = gutenberg_get_template_hierarchy( $request['slug'], $request['is_custom'], $request['template_prefix'] );
		$fallback_template = resolve_block_template( $request['slug'], $hierarchy, '' );
		$response          = $this->prepare_item_for_response( $fallback_template, $request );
		return rest_ensure_response( $response );
	}

	/**
	 * Returns a list of templates.
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		$query = array();
		if ( isset( $request['wp_id'] ) ) {
			$query['wp_id'] = $request['wp_id'];
		}
		if ( isset( $request['area'] ) ) {
			$query['area'] = $request['area'];
		}
		if ( isset( $request['post_type'] ) ) {
			$query['post_type'] = $request['post_type'];
		}

		$templates = array();
		foreach ( gutenberg_get_block_templates( $query, $this->post_type ) as $template ) {
			$data        = $this->prepare_item_for_response( $template, $request );
			$templates[] = $this->prepare_response_for_collection( $data );
		}

		return rest_ensure_response( $templates );
	}

	/**
	 * Returns the given template
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		if ( isset( $request['source'] ) && 'theme' === $request['source'] ) {
			$template = get_block_file_template( $request['id'], $this->post_type );
		} else {
			$template = gutenberg_get_block_template( $request['id'], $this->post_type );
		}

		if ( ! $template ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exist with that id.', 'gutenberg' ), array( 'status' => 404 ) );
		}

		return $this->prepare_item_for_response( $template, $request );
	}

	/**
	 * Creates a single template.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		$changes = $this->prepare_item_for_database( $request );
		if ( is_wp_error( $changes ) ) {
			return $changes;
		}

		$changes->post_name = $request['slug'];
		$result             = wp_insert_post( wp_slash( (array) $changes ), true );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$posts = gutenberg_get_block_templates( array( 'wp_id' => $result ), $this->post_type );
		if ( ! count( $posts ) ) {
			return new WP_Error( 'rest_template_insert_error', __( 'No templates exist with that id.', 'gutenberg' ) );
		}
		$id       = $posts[0]->id;
		$template = gutenberg_get_block_template( $id, $this->post_type );

		$fields_update = $this->update_additional_fields_for_object( $template, $request );
		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}

		return $this->prepare_item_for_response(
			gutenberg_get_block_template( $id, $this->post_type ),
			$request
		);
	}

	/**
	 * Updates a single template.
	 *
	 * @since 5.8.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$template = gutenberg_get_block_template( $request['id'], $this->post_type );
		if ( ! $template ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exist with that id.', 'gutenberg' ), array( 'status' => 404 ) );
		}

		$post_before = get_post( $template->wp_id );

		if ( isset( $request['source'] ) && 'theme' === $request['source'] ) {
			wp_delete_post( $template->wp_id, true );
			$request->set_param( 'context', 'edit' );

			$template = gutenberg_get_block_template( $request['id'], $this->post_type );
			$response = $this->prepare_item_for_response( $template, $request );

			return rest_ensure_response( $response );
		}

		$changes = $this->prepare_item_for_database( $request );

		if ( is_wp_error( $changes ) ) {
			return $changes;
		}

		if ( 'custom' === $template->source ) {
			$update = true;
			$result = wp_update_post( wp_slash( (array) $changes ), false );
		} else {
			$update      = false;
			$post_before = null;
			$result      = wp_insert_post( wp_slash( (array) $changes ), false );
		}

		if ( is_wp_error( $result ) ) {
			if ( 'db_update_error' === $result->get_error_code() ) {
				$result->add_data( array( 'status' => 500 ) );
			} else {
				$result->add_data( array( 'status' => 400 ) );
			}
			return $result;
		}

		$template      = gutenberg_get_block_template( $request['id'], $this->post_type );
		$fields_update = $this->update_additional_fields_for_object( $template, $request );
		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}

		$request->set_param( 'context', 'edit' );

		$post = get_post( $template->wp_id );
		/** This action is documented in wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php */
		do_action( "rest_after_insert_{$this->post_type}", $post, $request, false );

		wp_after_insert_post( $post, $update, $post_before );

		$response = $this->prepare_item_for_response( $template, $request );

		return rest_ensure_response( $response );
	}

	/**
	 * Prepares a single template for create or update.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return stdClass Changes to pass to wp_update_post.
	 */
	protected function prepare_item_for_database( $request ) {
		$template = $request['id'] ? gutenberg_get_block_template( $request['id'], $this->post_type ) : null;
		$changes  = new stdClass();
		if ( null === $template ) {
			$changes->post_type   = $this->post_type;
			$changes->post_status = 'publish';
			$changes->tax_input   = array(
				'wp_theme' => isset( $request['theme'] ) ? $request['theme'] : get_stylesheet(),
			);
		} elseif ( 'custom' !== $template->source ) {
			$changes->post_name   = $template->slug;
			$changes->post_type   = $this->post_type;
			$changes->post_status = 'publish';
			$changes->tax_input   = array(
				'wp_theme' => $template->theme,
			);
			$changes->meta_input  = array(
				'origin' => $template->source,
			);
		} else {
			$changes->post_name   = $template->slug;
			$changes->ID          = $template->wp_id;
			$changes->post_status = 'publish';
		}
		if ( isset( $request['content'] ) ) {
			$changes->post_content = $request['content'];
		} elseif ( null !== $template && 'custom' !== $template->source ) {
			$changes->post_content = $template->content;
		}
		if ( isset( $request['title'] ) ) {
			$changes->post_title = $request['title'];
		} elseif ( null !== $template && 'custom' !== $template->source ) {
			$changes->post_title = $template->title;
		}
		if ( isset( $request['description'] ) ) {
			$changes->post_excerpt = $request['description'];
		} elseif ( null !== $template && 'custom' !== $template->source ) {
			$changes->post_excerpt = $template->description;
		}

		if ( 'wp_template' === $this->post_type ) {
			if ( isset( $request['is_wp_suggestion'] ) ) {
				$changes->meta_input     = wp_parse_args(
					array(
						'is_wp_suggestion' => $request['is_wp_suggestion'],
					),
					$changes->meta_input = array()
				);
			}
		}
		if ( 'wp_template_part' === $this->post_type ) {
			if ( isset( $request['area'] ) ) {
				$changes->tax_input['wp_template_part_area'] = _filter_block_template_part_area( $request['area'] );
			} elseif ( null !== $template && 'custom' !== $template->source && $template->area ) {
				$changes->tax_input['wp_template_part_area'] = _filter_block_template_part_area( $template->area );
			} elseif ( ! $template->area ) {
				$changes->tax_input['wp_template_part_area'] = WP_TEMPLATE_PART_AREA_UNCATEGORIZED;
			}
		}

		if ( ! empty( $request['author'] ) ) {
			$post_author = (int) $request['author'];

			if ( get_current_user_id() !== $post_author ) {
				$user_obj = get_userdata( $post_author );

				if ( ! $user_obj ) {
					return new WP_Error(
						'rest_invalid_author',
						__( 'Invalid author ID.', 'gutenberg' ),
						array( 'status' => 400 )
					);
				}
			}

			$changes->post_author = $post_author;
		}
		return $changes;
	}
}
