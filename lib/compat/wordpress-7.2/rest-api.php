<?php
/**
 * WordPress 7.2 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Prepares a value for JSON encoding according to its schema.
 *
 * Preserves the distinction between JSON objects and arrays by converting
 * empty PHP arrays to objects where the schema identifies them as objects.
 * Nested properties and items are prepared according to their schemas.
 * Empty arrays remain arrays when a matching schema allows them.
 *
 * Prepares the representation of existing values without inserting defaults
 * or performing full JSON Schema validation.
 *
 * Copy of `wp_prepare_json_value_for_client()` from WordPress 7.2.
 *
 * @param mixed                $value  The value to prepare.
 * @param array<string, mixed> $schema The schema describing the value.
 * @return mixed The value prepared for JSON encoding.
 */
function gutenberg_prepare_json_value_for_client( $value, array $schema ) {
	if ( $value instanceof JsonSerializable ) {
		$value = $value->jsonSerialize();
	}

	if ( ! is_array( $value ) && ! $value instanceof stdClass ) {
		return $value;
	}

	foreach ( array( 'anyOf', 'oneOf' ) as $keyword ) {
		if ( ! isset( $schema[ $keyword ] ) ) {
			continue;
		}

		$matching_schema = null;

		/*
		 * Prefer an array schema for PHP lists. An empty PHP array also matches an
		 * object schema, but should remain [] when an array schema accepts it.
		 */
		if ( is_array( $value ) && array_is_list( $value ) ) {
			foreach ( $schema[ $keyword ] as $candidate_schema ) {
				if ( ! isset( $candidate_schema['type'] ) && isset( $schema['type'] ) ) {
					$candidate_schema['type'] = $schema['type'];
				}

				if ( _gutenberg_json_schema_matches_type( $value, $candidate_schema, 'array' ) ) {
					$matching_schema = $candidate_schema;
					break;
				}
			}
		}

		// Like rest_filter_response_by_context(), use the first matching oneOf branch.
		if ( null === $matching_schema ) {
			$matching_schema = 'anyOf' === $keyword
				? rest_find_any_matching_schema( $value, $schema, '' )
				: rest_find_one_matching_schema( $value, $schema, '', true );
		}

		if ( is_wp_error( $matching_schema ) ) {
			continue;
		}

		if ( ! isset( $schema['type'] ) && isset( $matching_schema['type'] ) ) {
			$schema['type'] = $matching_schema['type'];
		}

		$value = gutenberg_prepare_json_value_for_client( $value, $matching_schema );
	}

	$is_array_value = is_array( $value );
	$types          = isset( $schema['type'] ) ? (array) $schema['type'] : array();
	$allows_object  = in_array( 'object', $types, true );
	$allows_array   = in_array( 'array', $types, true );

	if ( $is_array_value && empty( $value ) && $allows_object && ! $allows_array ) {
		return (object) $value;
	}

	$is_object_value = $value instanceof stdClass || ( $is_array_value && $allows_object && ( ! $allows_array || ! array_is_list( $value ) ) );
	if ( $allows_object && $is_object_value ) {
		if ( $value instanceof stdClass ) {
			$value = clone $value;
		}

		foreach ( $value as $property => $property_value ) {
			$property_schema = null;
			if ( isset( $schema['properties'][ $property ] ) && is_array( $schema['properties'][ $property ] ) ) {
				$property_schema = $schema['properties'][ $property ];
			} else {
				$property_schema = rest_find_matching_pattern_property_schema( $property, $schema );
				if ( null === $property_schema && isset( $schema['additionalProperties'] ) && is_array( $schema['additionalProperties'] ) ) {
					$property_schema = $schema['additionalProperties'];
				}
			}

			if ( null === $property_schema ) {
				continue;
			}

			$property_value = gutenberg_prepare_json_value_for_client( $property_value, $property_schema );
			if ( is_array( $value ) ) {
				$value[ $property ] = $property_value;
			} else {
				$value->$property = $property_value;
			}
		}
	} elseif ( $allows_array && $is_array_value && isset( $schema['items'] ) && is_array( $schema['items'] ) ) {
		foreach ( $value as $index => $item ) {
			$value[ $index ] = gutenberg_prepare_json_value_for_client( $item, $schema['items'] );
		}
	}

	return $value;
}

/**
 * Determines whether a value matches a JSON Schema through a given type.
 *
 * Combining schemas must have a matching branch that allows the requested type.
 * Finding the type in one branch and validating the value against another branch
 * is not sufficient.
 *
 * Copy of `_wp_json_schema_matches_type()` from WordPress 7.2.
 *
 * @access private
 *
 * @param mixed                $value  The value to validate.
 * @param array<string, mixed> $schema The schema to inspect.
 * @param string               $type   The type to match.
 * @return bool Whether the value matches the schema through the requested type.
 */
function _gutenberg_json_schema_matches_type( $value, array $schema, string $type ): bool {
	if ( isset( $schema['type'] ) && ! in_array( $type, (array) $schema['type'], true ) ) {
		return false;
	}

	foreach ( array( 'anyOf', 'oneOf' ) as $keyword ) {
		if ( ! isset( $schema[ $keyword ] ) ) {
			continue;
		}

		foreach ( $schema[ $keyword ] as $sub_schema ) {
			if ( ! is_array( $sub_schema ) ) {
				continue;
			}

			// Match rest_find_any_matching_schema(), which applies the parent type to untyped branches.
			if ( ! isset( $sub_schema['type'] ) && isset( $schema['type'] ) ) {
				$sub_schema['type'] = $schema['type'];
			}

			if ( _gutenberg_json_schema_matches_type( $value, $sub_schema, $type ) ) {
				continue 2;
			}
		}

		return false;
	}

	if ( ! isset( $schema['type'] ) && ! isset( $schema['anyOf'] ) && ! isset( $schema['oneOf'] ) ) {
		return false;
	}

	// Explicit and inferred types must both validate through the requested type only.
	$schema['type'] = $type;

	return ! is_wp_error( rest_validate_value_from_schema( $value, $schema ) );
}

/**
 * Registers the View Config REST API routes.
 *
 * Replaces the 7.1 registration so the route is served by the 7.2 controller.
 */
function gutenberg_register_view_config_controller_endpoints_7_2() {
	$view_config_controller = new Gutenberg_REST_View_Config_Controller_7_2();
	$view_config_controller->register_routes();
}
remove_action( 'rest_api_init', 'gutenberg_register_view_config_controller_endpoints', PHP_INT_MAX );
add_action( 'rest_api_init', 'gutenberg_register_view_config_controller_endpoints_7_2', PHP_INT_MAX );

/**
 * Registers the Fields REST API route.
 *
 * Exposes the fields registered on the server on the `wp_entity_fields_api_init` action.
 *
 * @see Gutenberg_REST_Entity_Fields_Controller_7_2
 */
function gutenberg_register_entity_fields_controller_endpoints() {
	$entity_fields_controller = new Gutenberg_REST_Entity_Fields_Controller_7_2();
	$entity_fields_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_entity_fields_controller_endpoints', PHP_INT_MAX );

/**
 * Registers the Actions REST API route.
 *
 * Exposes the actions registered on the server on the `wp_entity_actions_api_init` action.
 *
 * @see Gutenberg_REST_Entity_Actions_Controller_7_2
 */
function gutenberg_register_entity_actions_controller_endpoints() {
	$entity_actions_controller = new Gutenberg_REST_Entity_Actions_Controller_7_2();
	$entity_actions_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_entity_actions_controller_endpoints', PHP_INT_MAX );

/**
 * Registers the Templates and Template Parts REST API routes.
 *
 * Replaces the core controller class so the 7.2 controller is used.
 *
 * @see Gutenberg_REST_Templates_Controller_7_2
 *
 * @param array $args Array of arguments for registering a post type.
 * @return array Modified array of arguments.
 */
function gutenberg_modify_template_post_type_args_7_2( $args ) {
	$args['rest_controller_class'] = 'Gutenberg_REST_Templates_Controller_7_2';
	return $args;
}
add_filter( 'register_wp_template_post_type_args', 'gutenberg_modify_template_post_type_args_7_2' );
add_filter( 'register_wp_template_part_post_type_args', 'gutenberg_modify_template_post_type_args_7_2' );

/**
 * Exposes the privacy policy page setting in the REST API.
 *
 * WordPress stores the page assigned in Settings > Privacy in the
 * `wp_page_for_privacy_policy` option, but does not register it with
 * `show_in_rest`, so the settings endpoint cannot report it. Registering it
 * lets the editor label the privacy policy page, alongside the homepage and
 * the posts page.
 *
 * Runs on `rest_api_init` after `register_initial_settings`, and skips
 * registration when WordPress Core already exposes the option.
 */
function gutenberg_register_privacy_policy_page_setting() {
	$registered = get_registered_settings();
	if (
		isset( $registered['wp_page_for_privacy_policy'] ) &&
		! empty( $registered['wp_page_for_privacy_policy']['show_in_rest'] )
	) {
		return;
	}

	register_setting(
		'reading',
		'wp_page_for_privacy_policy',
		array(
			'show_in_rest' => array(
				'name' => 'page_for_privacy_policy',
			),
			'type'         => 'integer',
			'description'  => __( 'The ID of the page that should be displayed as the privacy policy page', 'gutenberg' ),
			'default'      => 0,
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_privacy_policy_page_setting', 11 );

/**
 * Prevents users without the `manage_privacy_options` capability from
 * changing the privacy policy page through the REST API.
 *
 * The settings endpoint only checks `manage_options`. On multisite the
 * `manage_privacy_options` capability maps to `manage_network`, so a site
 * administrator can read the setting but must not change it, matching the
 * Settings > Privacy screen.
 *
 * @param bool   $updated Whether the setting update has already been handled.
 * @param string $name    Setting name (as shown in REST API responses).
 * @return bool Whether to short-circuit the update.
 */
function gutenberg_restrict_privacy_policy_page_setting_update( $updated, $name ) {
	if ( 'page_for_privacy_policy' === $name && ! current_user_can( 'manage_privacy_options' ) ) {
		return true;
	}
	return $updated;
}
add_filter( 'rest_pre_update_setting', 'gutenberg_restrict_privacy_policy_page_setting_update', 10, 2 );

/**
 * Adds the `action-trash` link to a REST response.
 *
 * Targets the `self` link, so responses whose `_fields` leave out `_links`
 * are skipped. Attachments run `rest_prepare_attachment` twice, so an
 * existing link is kept.
 *
 * @param WP_REST_Response $response The response object.
 */
function gutenberg_add_trash_action_link( $response ) {
	$links = $response->get_links();
	if (
		empty( $links['self'][0]['href'] ) ||
		isset( $links['https://api.w.org/action-trash'] )
	) {
		return;
	}

	$response->add_link( 'https://api.w.org/action-trash', $links['self'][0]['href'] );
}

/**
 * Adds the `action-trash` link to posts the current user can move to the trash.
 *
 * Without the link, deleting the post is permanent.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Post          $post     Post object.
 * @param WP_REST_Request  $request  Request object.
 * @return WP_REST_Response The response object.
 */
function gutenberg_add_post_trash_action_link( $response, $post, $request ) {
	if (
		! $post instanceof WP_Post ||
		'edit' !== $request['context'] ||
		'trash' === $post->post_status ||
		! current_user_can( 'delete_post', $post->ID )
	) {
		return $response;
	}

	// Mirrors `WP_REST_Posts_Controller::delete_item()`.
	$supports_trash = ( EMPTY_TRASH_DAYS > 0 );
	if ( 'attachment' === $post->post_type ) {
		$supports_trash = $supports_trash && MEDIA_TRASH;
	}

	/** This filter is documented in wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php */
	$supports_trash = apply_filters( "rest_{$post->post_type}_trashable", $supports_trash, $post );
	if ( $supports_trash ) {
		gutenberg_add_trash_action_link( $response );
	}

	return $response;
}

/**
 * Adds the `action-trash` link to comments the current user can move to the trash.
 *
 * Without the link, deleting the comment is permanent.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Comment       $comment  Comment object.
 * @param WP_REST_Request  $request  Request object.
 * @return WP_REST_Response The response object.
 */
function gutenberg_add_comment_trash_action_link( $response, $comment, $request ) {
	if (
		'edit' !== $request['context'] ||
		'trash' === $comment->comment_approved ||
		(
			! current_user_can( 'moderate_comments' ) &&
			! current_user_can( 'edit_comment', $comment->comment_ID )
		)
	) {
		return $response;
	}

	/** This filter is documented in wp-includes/rest-api/endpoints/class-wp-rest-comments-controller.php */
	$supports_trash = apply_filters( 'rest_comment_trashable', ( EMPTY_TRASH_DAYS > 0 ), $comment );
	if ( $supports_trash ) {
		gutenberg_add_trash_action_link( $response );
	}

	return $response;
}
add_filter( 'rest_prepare_comment', 'gutenberg_add_comment_trash_action_link', 10, 3 );

/**
 * Registers the `action-trash` link filter for post types shown in REST.
 *
 * Menu items and fonts can only be deleted permanently, so they're skipped.
 *
 * @param string       $post_type        Post type slug.
 * @param WP_Post_Type $post_type_object Post type object.
 */
function gutenberg_register_post_trash_action_link( $post_type, $post_type_object ) {
	if (
		! $post_type_object->show_in_rest ||
		in_array( $post_type, array( 'nav_menu_item', 'wp_font_family', 'wp_font_face' ), true )
	) {
		return;
	}

	add_filter( "rest_prepare_{$post_type}", 'gutenberg_add_post_trash_action_link', 10, 3 );
}
add_action( 'registered_post_type', 'gutenberg_register_post_trash_action_link', 10, 2 );

/**
 * Adds the `action-set-homepage` and `action-set-posts-page` links to the
 * pages the current user can set as the homepage or as the posts page.
 *
 * A page can be set as either when it's published and it's neither the
 * homepage nor the posts page yet. Both change the site settings, so they
 * require `manage_options`, like the settings route.
 *
 * The links depend on the site settings, so a client that changes the
 * homepage or the posts page requests the affected pages again.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Post          $post     Post object.
 * @param WP_REST_Request  $request  Request object.
 * @return WP_REST_Response The response object.
 */
function gutenberg_add_page_homepage_action_links( $response, $post, $request ) {
	if (
		! $post instanceof WP_Post ||
		'edit' !== $request['context'] ||
		'publish' !== $post->post_status ||
		! current_user_can( 'manage_options' ) ||
		(int) get_option( 'page_on_front' ) === $post->ID ||
		(int) get_option( 'page_for_posts' ) === $post->ID
	) {
		return $response;
	}

	// Targets the `self` link, so responses whose `_fields` leave out
	// `_links` are skipped.
	$links = $response->get_links();
	if ( empty( $links['self'][0]['href'] ) ) {
		return $response;
	}

	// WordPress 7.2 adds the links in `get_available_actions()`, so an
	// existing link is kept.
	foreach ( array( 'https://api.w.org/action-set-homepage', 'https://api.w.org/action-set-posts-page' ) as $rel ) {
		if ( ! isset( $links[ $rel ] ) ) {
			$response->add_link( $rel, $links['self'][0]['href'] );
		}
	}

	return $response;
}
add_filter( 'rest_prepare_page', 'gutenberg_add_page_homepage_action_links', 10, 3 );

/**
 * Only includes revisioned meta in revision and autosave responses.
 *
 * Only the meta keys from `wp_post_revision_meta_keys()` are stored on a
 * revision, but the revisions endpoint returns every `show_in_rest` meta key
 * of the parent post type. The others come back as their default value, and
 * restoring the revision in the editor saves those defaults over the post's
 * real values.
 *
 * When an author autosaves their own draft, the autosaves controller updates
 * the post itself and returns it, so it keeps all of its meta.
 *
 * Once WordPress limits the meta in `WP_REST_Revisions_Controller` itself,
 * this leaves those responses unchanged. Unlike the Core fix, this doesn't
 * change the `meta` schema.
 *
 * @see https://core.trac.wordpress.org/ticket/66329
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Post          $post     The revision or autosave.
 * @return WP_REST_Response The response object.
 */
function gutenberg_rest_only_include_revisioned_meta( $response, $post ) {
	if ( ! $response instanceof WP_REST_Response || ! $post instanceof WP_Post || 'revision' !== $post->post_type ) {
		return $response;
	}

	$data = $response->get_data();
	if ( empty( $data['meta'] ) || ! is_array( $data['meta'] ) ) {
		return $response;
	}

	$post_type = get_post_type( $post->post_parent );
	if ( ! $post_type ) {
		return $response;
	}

	// Map the revisioned keys to their REST names, like `WP_REST_Meta_Fields::get_registered_fields()` does.
	$meta_args  = array_merge( get_registered_meta_keys( 'post' ), get_registered_meta_keys( 'post', $post_type ) );
	$rest_names = array();
	foreach ( (array) wp_post_revision_meta_keys( $post_type ) as $meta_key ) {
		// The keys are filterable, so ignore anything that isn't a meta key.
		if ( ! is_string( $meta_key ) ) {
			continue;
		}

		$show_in_rest = $meta_args[ $meta_key ]['show_in_rest'] ?? false;
		if ( $show_in_rest ) {
			$rest_names[] = empty( $show_in_rest['name'] ) ? $meta_key : $show_in_rest['name'];
		}
	}

	$data['meta'] = array_intersect_key( $data['meta'], array_flip( $rest_names ) );
	$response->set_data( $data );

	return $response;
}
add_filter( 'rest_prepare_revision', 'gutenberg_rest_only_include_revisioned_meta', 10, 2 );
