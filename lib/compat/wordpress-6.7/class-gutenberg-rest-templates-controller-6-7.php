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
	 * Returns the given template
	 *
	 * @param WP_REST_Request $request The request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		if ( isset( $request['source'] ) && ( 'theme' === $request['source'] || 'plugin' === $request['source'] ) ) {
			$template = get_block_file_template( $request['id'], $this->post_type );
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
	// @core-merge: Fix wrong author in plugin templates.
	public function prepare_item_for_response( $item, $request ) {
		$template = $item;

		$fields = $this->get_fields_for_response( $request );

		if ( 'plugin' !== $item->origin ) {
			return parent::prepare_item_for_response( $item, $request );
		}
		$cloned_item = clone $item;
		// Set the origin as theme when calling the previous `prepare_item_for_response()` to prevent warnings when generating the author text.
		$cloned_item->origin = 'theme';
		$response            = parent::prepare_item_for_response( $cloned_item, $request );
		$data                = $response->data;

		if ( rest_is_field_included( 'origin', $fields ) ) {
			$data['origin'] = 'plugin';
		}

		if ( rest_is_field_included( 'plugin', $fields ) ) {
			$registered_template = WP_Block_Templates_Registry::get_instance()->get_by_slug( $cloned_item->slug );
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
	// @core-merge: Changed the comments format (from inline to multi-line) in the entire function.
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
			// @core-merge: Removed `$template_object->has_theme_file` check from this if clause.
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
				if ( ! function_exists( 'get_plugins' ) || ! function_exists( 'get_plugin_data' ) ) {
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
				return isset( $template_object->plugin ) ?
					$template_object->plugin :
					$template_object->theme;
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
