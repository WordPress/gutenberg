<?php
/**
 * REST API: Gutenberg_REST_Templates_Controller_6_7 class
 *
 * @package    gutenberg
 */

/**
 * Gutenberg_REST_Templates_Controller_6_7 class
 *
 */
class Gutenberg_REST_Templates_Controller_6_7 extends Gutenberg_REST_Templates_Controller_6_6 {
	/**
	 * Retrieves the block type' schema, conforming to JSON Schema.
	 *
	 * @since 5.8.0
	 * @since 5.9.0 Added `'area'`.
	 * @since 6.7.0 Added `'plugin'`.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => $this->post_type,
			'type'       => 'object',
			'properties' => array(
				'id'              => array(
					'description' => __( 'ID of template.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'slug'            => array(
					'description' => __( 'Unique slug identifying the template.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'required'    => true,
					'minLength'   => 1,
					'pattern'     => '[a-zA-Z0-9_\%-]+',
				),
				'theme'           => array(
					'description' => __( 'Theme identifier for the template.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				// @core-merge: Add plugin property to the schema.
				'plugin'          => array(
					'description' => __( 'Plugin that registered the template.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				// @core-merge: End of changes.
				'type'            => array(
					'description' => __( 'Type of template.' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'source'          => array(
					'description' => __( 'Source of template' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'origin'          => array(
					'description' => __( 'Source of a customized template' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'content'         => array(
					'description' => __( 'Content of template.' ),
					'type'        => array( 'object', 'string' ),
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'properties'  => array(
						'raw'           => array(
							'description' => __( 'Content for the template, as it exists in the database.' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
						),
						'block_version' => array(
							'description' => __( 'Version of the content block format used by the template.' ),
							'type'        => 'integer',
							'context'     => array( 'edit' ),
							'readonly'    => true,
						),
					),
				),
				'title'           => array(
					'description' => __( 'Title of template.' ),
					'type'        => array( 'object', 'string' ),
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'properties'  => array(
						'raw'      => array(
							'description' => __( 'Title for the template, as it exists in the database.' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
						'rendered' => array(
							'description' => __( 'HTML title for the template, transformed for display.' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
							'readonly'    => true,
						),
					),
				),
				'description'     => array(
					'description' => __( 'Description of template.' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'status'          => array(
					'description' => __( 'Status of template.' ),
					'type'        => 'string',
					'enum'        => array_keys( get_post_stati( array( 'internal' => false ) ) ),
					'default'     => 'publish',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'wp_id'           => array(
					'description' => __( 'Post ID.' ),
					'type'        => 'integer',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'has_theme_file'  => array(
					'description' => __( 'Theme file exists.' ),
					'type'        => 'bool',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'author'          => array(
					'description' => __( 'The ID for the author of the template.' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'modified'        => array(
					'description' => __( "The date the template was last modified, in the site's timezone." ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'author_text'     => array(
					'type'        => 'string',
					'description' => __( 'Human readable text for the author.' ),
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'original_source' => array(
					'description' => __( 'Where the template originally comes from e.g. \'theme\'' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
					'enum'        => array(
						'theme',
						'plugin',
						'site',
						'user',
					),
				),
			),
		);

		if ( 'wp_template' === $this->post_type ) {
			$schema['properties']['is_custom'] = array(
				'description' => __( 'Whether a template is a custom template.' ),
				'type'        => 'bool',
				'context'     => array( 'embed', 'view', 'edit' ),
				'readonly'    => true,
			);
		}

		if ( 'wp_template_part' === $this->post_type ) {
			$schema['properties']['area'] = array(
				'description' => __( 'Where the template part is intended for use (header, footer, etc.)' ),
				'type'        => 'string',
				'context'     => array( 'embed', 'view', 'edit' ),
			);
		}

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Returns the given template
	 *
	 * @param WP_REST_Request $request The request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		if ( isset( $request['source'] ) && 'theme' === $request['source'] ) {
			$template = get_block_file_template( $request['id'], $this->post_type );
			// @core-merge: Add a special case for plugin templates.
		} elseif ( isset( $request['source'] ) && 'plugin' === $request['source'] ) {
			list( , $slug ) = explode( '//', $request['id'] );
			$template       = WP_Templates_Registry::get_instance()->get_by_slug( $slug );
			// @core-merge: End of changes to merge in core.
		} else {
			$template = get_block_template( $request['id'], $this->post_type );
		}

		if ( ! $template ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exist with that id.' ), array( 'status' => 404 ) );
		}

		return $this->prepare_item_for_response( $template, $request );
	}

	/**
	 * Prepare a single template output for response
	 *
	 * @param WP_Block_Template $item    Template instance.
	 * @param WP_REST_Request   $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$template = $item;

		$fields = $this->get_fields_for_response( $request );

		if ( 'plugin' !== $item->origin ) {
			return parent::prepare_item_for_response( $item, $request );
		}
		// @core-merge: Fix wrong author in plugin templates.
		$cloned_item = clone $item;
		// Set the origin as theme when calling the previous `prepare_item_for_response()` to prevent warnings when generating the author text.
		$cloned_item->origin = 'theme';
		$response            = parent::prepare_item_for_response( $cloned_item, $request );
		$data                = $response->data;

		if ( rest_is_field_included( 'origin', $fields ) ) {
			$data['origin'] = 'plugin';
		}

		if ( rest_is_field_included( 'plugin', $fields ) ) {
			$registered_template = WP_Templates_Registry::get_instance()->get_by_slug( $cloned_item->slug );
			if ( $registered_template ) {
				$data['plugin'] = $registered_template->plugin;
			}
		}

		if ( rest_is_field_included( 'author_text', $fields ) ) {
			$data['author_text'] = $this->get_wp_templates_author_text_field( $template );
		}

		if ( rest_is_field_included( 'original_source', $fields ) ) {
			$data['original_source'] = $this->get_wp_templates_original_source_field( $template );
		}

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
	 * @param WP_Block_Template $template_object Template instance.
	 * @return string                            Original source of the template one of theme, plugin, site, or user.
	 */
	// @core-merge: Only the comments format (from inline to multi-line) has changed in this file.
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
			if ( $template_object->has_theme_file && 'plugin' === $template_object->origin ) {
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
				// @core-merge: Prioritize plugin name instead of theme name for plugin-registered templates.
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
				return $template_object->theme;
				// @core-merge: End of changes to merge in core.
			case 'site':
				return get_bloginfo( 'name' );
			case 'user':
				$author = get_user_by( 'id', $template_object->author );
				if ( ! $author ) {
					return __( 'Unknown author' );
				}
				return $author->get( 'display_name' );
		}
	}
}
