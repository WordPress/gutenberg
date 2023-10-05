<?php
/**
 * REST API: Gutenberg_REST_Templates_Controller_6_3 class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Base Templates REST API Controller.
 */
class Gutenberg_REST_Templates_Controller_6_3 extends WP_REST_Templates_Controller {

	/**
	 * Registers the controllers routes.
	 *
	 * @return void
	 */
	public function register_routes() {

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
		// Get fallback template content.
	}

	/**
	 * Returns the fallback template for a given slug.
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_template_fallback( $request ) {
		$hierarchy         = get_template_hierarchy( $request['slug'], $request['is_custom'], $request['template_prefix'] );
		$fallback_template = null;
		do {
			$fallback_template = resolve_block_template( $request['slug'], $hierarchy, '' );
			array_shift( $hierarchy );
		} while ( ! empty( $hierarchy ) && empty( $fallback_template->content ) );
		$response = $this->prepare_item_for_response( $fallback_template, $request );
		return rest_ensure_response( $response );
	}

	/**
	 * DRAFT: Prepares a single template for create or update.
	 *
	 * @since 5.8.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return stdClass Changes to pass to wp_update_post.
	 */
	protected function prepare_item_for_database( $request ) {
		$template = $request['id'] ? get_block_template( $request['id'], $this->post_type ) : null;
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
				'origin' => 'origin_meta',
			);
		} else {
			$changes->post_name   = $template->slug;
			$changes->ID          = $template->wp_id;
			$changes->post_status = 'publish';
		}
		if ( isset( $request['content'] ) ) {
			if ( is_string( $request['content'] ) ) {
				$changes->post_content = $request['content'];
			} elseif ( isset( $request['content']['raw'] ) ) {
				$changes->post_content = $request['content']['raw'];
			}
		} elseif ( null !== $template && 'custom' !== $template->source ) {
			$changes->post_content = $template->content;
		}
		if ( isset( $request['title'] ) ) {
			if ( is_string( $request['title'] ) ) {
				$changes->post_title = $request['title'];
			} elseif ( ! empty( $request['title']['raw'] ) ) {
				$changes->post_title = $request['title']['raw'];
			}
		} elseif ( null !== $template && 'custom' !== $template->source ) {
			$changes->post_title = $template->title;
		}
		if ( isset( $request['description'] ) ) {
			$changes->post_excerpt = $request['description'];
		} elseif ( null !== $template && 'custom' !== $template->source ) {
			$changes->post_excerpt = $template->description;
		}

		if ( 'wp_template' === $this->post_type && isset( $request['is_wp_suggestion'] ) ) {
			$changes->meta_input     = wp_parse_args(
				array(
					'is_wp_suggestion' => $request['is_wp_suggestion'],
				),
				$changes->meta_input = array()
			);
		}

		if ( 'wp_template_part' === $this->post_type ) {
			if ( isset( $request['area'] ) ) {
				$changes->tax_input['wp_template_part_area'] = _filter_block_template_part_area( $request['area'] );
			} elseif ( null !== $template && 'custom' !== $template->source && $template->area ) {
				$changes->tax_input['wp_template_part_area'] = _filter_block_template_part_area( $template->area );
			} elseif ( empty( $template->area ) ) {
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
						__( 'Invalid author ID.' ),
						array( 'status' => 400 )
					);
				}
			}

			$changes->post_author = $post_author;
		}

		return $changes;
	}

	/**
	 * DRAFT: Prepare a single template output for response
	 *
	 * @since 5.8.0
	 * @since 5.9.0 Renamed `$template` to `$item` to match parent class for PHP 8 named parameter support.
	 * @since 6.3.0 Added `modified` property to the response.
	 *
	 * @param WP_Block_Template $item    Template instance.
	 * @param WP_REST_Request   $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		// Restores the more descriptive, specific name for use within this method.
		$template = $item;

		$fields = $this->get_fields_for_response( $request );

		// Base fields for every template.
		$data = array();

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = $template->id;
		}

		if ( rest_is_field_included( 'theme', $fields ) ) {
			$data['theme'] = $template->theme;
		}

		if ( rest_is_field_included( 'content', $fields ) ) {
			$data['content'] = array();
		}
		if ( rest_is_field_included( 'content.raw', $fields ) ) {
			$data['content']['raw'] = $template->content;
		}

		if ( rest_is_field_included( 'content.block_version', $fields ) ) {
			$data['content']['block_version'] = block_version( $template->content );
		}

		if ( rest_is_field_included( 'slug', $fields ) ) {
			$data['slug'] = $template->slug;
		}

		if ( rest_is_field_included( 'source', $fields ) ) {
			$data['source'] = $template->source;
		}

		if ( rest_is_field_included( 'origin', $fields ) ) {
			$data['origin'] = $template->origin;
		}

		if ( rest_is_field_included( 'type', $fields ) ) {
			$data['type'] = $template->type;
		}

		if ( rest_is_field_included( 'description', $fields ) ) {
			$data['description'] = $template->description;
		}

		if ( rest_is_field_included( 'title', $fields ) ) {
			$data['title'] = array();
		}

		if ( rest_is_field_included( 'title.raw', $fields ) ) {
			$data['title']['raw'] = $template->title;
		}

		if ( rest_is_field_included( 'title.rendered', $fields ) ) {
			if ( $template->wp_id ) {
				/** This filter is documented in wp-includes/post-template.php */
				$data['title']['rendered'] = apply_filters( 'the_title', $template->title, $template->wp_id );
			} else {
				$data['title']['rendered'] = $template->title;
			}
		}

		if ( rest_is_field_included( 'status', $fields ) ) {
			$data['status'] = $template->status;
		}

		if ( rest_is_field_included( 'wp_id', $fields ) ) {
			$data['wp_id'] = (int) $template->wp_id;
		}

		if ( rest_is_field_included( 'has_theme_file', $fields ) ) {
			$data['has_theme_file'] = (bool) $template->has_theme_file;
		}

		if ( rest_is_field_included( 'is_custom', $fields ) && 'wp_template' === $template->type ) {
			$data['is_custom'] = $template->is_custom;
		}

		if ( rest_is_field_included( 'author', $fields ) ) {
			$data['author'] = (int) $template->author;
		}

		if ( rest_is_field_included( 'area', $fields ) && 'wp_template_part' === $template->type ) {
			$data['area'] = $template->area;
		}

		if ( rest_is_field_included( 'modified', $fields ) ) {
			$data['modified'] = mysql_to_rfc3339( $template->modified );
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		if ( rest_is_field_included( '_links', $fields ) || rest_is_field_included( '_embedded', $fields ) ) {
			$links = $this->prepare_links( $template->id );
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
	 * DRAFT: Updates a single template.
	 *
	 * @since 5.8.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$template = get_block_template( $request['id'], $this->post_type );

		// Rebuild file template path
		// $template_base_paths = get_block_theme_folders( $template->theme );
		// $file_path           = $template->theme . '/' . $template_base_paths[ $template->type ] . '/' . $template->slug . '.html';

		// $template->file_path = $file_path;
		// return $template;
		if ( ! $template ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exist with that id.' ), array( 'status' => 404 ) );
		}

		$post_before = get_post( $template->wp_id );

		if ( isset( $request['source'] ) && 'theme' === $request['source'] ) {
			wp_delete_post( $template->wp_id, true );
			$request->set_param( 'context', 'edit' );

			$template = get_block_template( $request['id'], $this->post_type );
			$response = $this->prepare_item_for_response( $template, $request );

			return rest_ensure_response( $response );
		}

		$changes = $this->prepare_item_for_database( $request );
		// draft: override `origin` meta value.
		$changes->meta_input  = array(
			'origin' => 'origin_meta_again',
		);

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

		$template      = get_block_template( $request['id'], $this->post_type );
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
}
