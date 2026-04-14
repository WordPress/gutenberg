<?php

/**
 * Core class used to access templates via the REST API for WordPress 7.0.
 *
 * This class extension exists only to override the core route,
 * and to ensure the gutenberg_resolve_pattern_blocks function is used in the prepare_item_for_response method.
 * See: https://github.com/WordPress/gutenberg/pull/73477
 *
 * Note: there are no changes in this class that need to be backported to core.
 *
 * @see WP_REST_Templates_Controller
 */
class Gutenberg_REST_Templates_Controller_7_0 extends WP_REST_Templates_Controller {
	/**
	 * Registers the controllers routes.
	 *
	 * @since 5.8.0
	 * @since 6.1.0 Endpoint for fallback template content.
	 */
	public function register_routes() {
		// Lists all templates.
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
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			),
			/*
			 * $override is set to true to ensure Gutenberg's route takes precedence
			 * over WordPress Core's automatic registration.
			 */
			true
		);

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
							'description' => __( 'The slug of the template to get the fallback for' ),
							'type'        => 'string',
							'required'    => true,
						),
						'is_custom'       => array(
							'description' => __( 'Indicates if a template is custom or part of the template hierarchy' ),
							'type'        => 'boolean',
						),
						'template_prefix' => array(
							'description' => __( 'The template prefix for the created template. This is used to extract the main template type, e.g. in `taxonomy-books` extracts the `taxonomy`' ),
							'type'        => 'string',
						),
					),
				),
			),
			/*
			 * $override is set to true to ensure Gutenberg's route takes precedence
			 * over WordPress Core's automatic registration.
			 */
			true
		);

		// Lists/updates a single template based on the given id.
		register_rest_route(
			$this->namespace,
			// The route.
			sprintf(
				'/%s/(?P<id>%s%s)',
				$this->rest_base,
				/*
				 * Matches theme's directory: `/themes/<subdirectory>/<theme>/` or `/themes/<theme>/`.
				 * Excludes invalid directory name characters: `/:<>*?"|`.
				 */
				'([^\/:<>\*\?"\|]+(?:\/[^\/:<>\*\?"\|]+)?)',
				// Matches the template name.
				'[\/\w%-]+'
			),
			array(
				'args'   => array(
					'id' => array(
						'description'       => __( 'The id of a template' ),
						'type'              => 'string',
						'sanitize_callback' => array( $this, '_sanitize_template_id' ),
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'context' => $this->get_context_param( array( 'default' => 'view' ) ),
					),
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
					'args'                => array(
						'force' => array(
							'type'        => 'boolean',
							'default'     => false,
							'description' => __( 'Whether to bypass Trash and force deletion.' ),
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			),
			/*
			 * $override is set to true to ensure Gutenberg's route takes precedence
			 * over WordPress Core's automatic registration.
			 */
			true
		);
	}

	/**
	 * Prepare a single template output for response
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
		// Don't prepare the response body for HEAD requests.
		if ( $request->is_method( 'HEAD' ) ) {
			return new WP_REST_Response( array() );
		}

		/*
		 * Resolve pattern blocks so they don't need to be resolved client-side
		 * in the editor, improving performance.
		 */
		$blocks = parse_blocks( $item->content );
		//////////////////////////////
		// START CORE MODIFICATIONS //
		//////////////////////////////
		$blocks = gutenberg_resolve_pattern_blocks( $blocks );
		//////////////////////////////
		// END CORE MODIFICATIONS //
		//////////////////////////////
		$item->content = serialize_blocks( $blocks );

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

		if ( rest_is_field_included( 'author_text', $fields ) ) {
			$data['author_text'] = self::get_wp_templates_author_text_field( $template );
		}

		if ( rest_is_field_included( 'original_source', $fields ) ) {
			$data['original_source'] = self::get_wp_templates_original_source_field( $template );
		}

		if ( rest_is_field_included( 'plugin', $fields ) ) {
			$registered_template = WP_Block_Templates_Registry::get_instance()->get_by_slug( $template->slug );
			if ( $registered_template ) {
				$data['plugin'] = $registered_template->plugin;
			}
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
	 * Returns the source from where the template originally comes from.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_Block_Template $template_object Template instance.
	 * @return string                            Original source of the template one of theme, plugin, site, or user.
	 */
	private static function get_wp_templates_original_source_field( $template_object ) {
		if ( 'wp_template' === $template_object->type || 'wp_template_part' === $template_object->type ) {
			/*
			 * Added by theme.
			 * Template originally provided by a theme, but customized by a user.
			 * Templates originally didn't have the 'origin' field so identify
			 * older customized templates by checking for no origin and a 'theme'
			 * or 'custom' source.
			 */
			if ( $template_object->has_theme_file &&
			( 'theme' === $template_object->origin || (
				empty( $template_object->origin ) && in_array(
					$template_object->source,
					array(
						'theme',
						'custom',
					),
					true
				) )
			)
			) {
				return 'theme';
			}

			// Added by plugin.
			if ( 'plugin' === $template_object->origin ) {
				return 'plugin';
			}

			/*
			 * Added by site.
			 * Template was created from scratch, but has no author. Author support
			 * was only added to templates in WordPress 5.9. Fallback to showing the
			 * site logo and title.
			 */
			if ( empty( $template_object->has_theme_file ) && 'custom' === $template_object->source && empty( $template_object->author ) ) {
				return 'site';
			}
		}

		// Added by user.
		return 'user';
	}

	/**
	 * Returns a human readable text for the author of the template.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_Block_Template $template_object Template instance.
	 * @return string                            Human readable text for the author.
	 */
	private static function get_wp_templates_author_text_field( $template_object ) {
		$original_source = self::get_wp_templates_original_source_field( $template_object );
		switch ( $original_source ) {
			case 'theme':
				$theme_name = wp_get_theme( $template_object->theme )->get( 'Name' );
				return empty( $theme_name ) ? $template_object->theme : $theme_name;
			case 'plugin':
				if ( ! function_exists( 'get_plugins' ) ) {
					require_once ABSPATH . 'wp-admin/includes/plugin.php';
				}
				if ( isset( $template_object->plugin ) ) {
					$plugins = wp_get_active_and_valid_plugins();

					foreach ( $plugins as $plugin_file ) {
						$plugin_basename = plugin_basename( $plugin_file );
						// Split basename by '/' to get the plugin slug.
						list( $plugin_slug, ) = explode( '/', $plugin_basename );

						if ( $plugin_slug === $template_object->plugin ) {
							$plugin_data = get_plugin_data( $plugin_file );

							if ( ! empty( $plugin_data['Name'] ) ) {
								return $plugin_data['Name'];
							}

							break;
						}
					}
				}

				/*
				 * Fall back to the theme name if the plugin is not defined. That's needed to keep backwards
				 * compatibility with templates that were registered before the plugin attribute was added.
				 */
				$plugins         = get_plugins();
				$plugin_basename = plugin_basename( sanitize_text_field( $template_object->theme . '.php' ) );
				if ( isset( $plugins[ $plugin_basename ] ) && isset( $plugins[ $plugin_basename ]['Name'] ) ) {
					return $plugins[ $plugin_basename ]['Name'];
				}
				return $template_object->plugin ?? $template_object->theme;
			case 'site':
				return get_bloginfo( 'name' );
			case 'user':
				$author = get_user_by( 'id', $template_object->author );
				if ( ! $author ) {
					return __( 'Unknown author' );
				}
				return $author->get( 'display_name' );
		}

		// Fail-safe to return a string should the original source ever fall through.
		return '';
	}
}
