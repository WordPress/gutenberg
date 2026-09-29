<?php
/**
 * WordPress 7.2 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Recursively casts empty arrays to objects where the schema types them as
 * objects.
 *
 * PHP cannot distinguish an empty associative array from an empty list, so
 * `json_encode()` always serializes `array()` as a JSON array (`[]`). A REST
 * schema, however, may type a value as an object, which must encode as `{}`.
 * This walks the value against its schema and casts any empty, object-typed
 * array to an object. Non-empty associative arrays already encode as objects,
 * so they are left as arrays and only recursed into to fix any nested empty
 * objects.
 *
 * Union schemas (`oneOf`/`anyOf`) are handled only for the empty-array case:
 * an empty value is cast to an object when any branch allows an object. Such
 * values are not recursed into.
 *
 * @param mixed $value  The value to normalize.
 * @param array $schema The schema node describing the value.
 * @return mixed The normalized value, with empty object-typed arrays cast to objects.
 */
function gutenberg_rest_cast_empty_objects_from_schema( $value, $schema ) {
	if ( ! is_array( $value ) || ! is_array( $schema ) ) {
		return $value;
	}

	if ( isset( $schema['oneOf'] ) || isset( $schema['anyOf'] ) ) {
		$branches = isset( $schema['oneOf'] ) ? $schema['oneOf'] : $schema['anyOf'];
		if ( array() === $value ) {
			foreach ( $branches as $branch ) {
				if ( is_array( $branch ) && in_array( 'object', (array) ( isset( $branch['type'] ) ? $branch['type'] : array() ), true ) ) {
					return (object) array();
				}
			}
		}
		return $value;
	}

	$types = (array) ( isset( $schema['type'] ) ? $schema['type'] : array() );

	if ( in_array( 'array', $types, true ) && isset( $schema['items'] ) ) {
		foreach ( $value as $index => $item ) {
			$value[ $index ] = gutenberg_rest_cast_empty_objects_from_schema( $item, $schema['items'] );
		}
		return $value;
	}

	if ( in_array( 'object', $types, true ) ) {
		if ( isset( $schema['properties'] ) ) {
			foreach ( $schema['properties'] as $property => $property_schema ) {
				if ( array_key_exists( $property, $value ) ) {
					$value[ $property ] = gutenberg_rest_cast_empty_objects_from_schema( $value[ $property ], $property_schema );
				}
			}
		}
		if ( isset( $schema['additionalProperties'] ) && is_array( $schema['additionalProperties'] ) ) {
			foreach ( $value as $key => $item ) {
				if ( isset( $schema['properties'][ $key ] ) ) {
					continue;
				}
				$value[ $key ] = gutenberg_rest_cast_empty_objects_from_schema( $item, $schema['additionalProperties'] );
			}
		}

		// Empty object-typed arrays must serialize as {} to match the schema.
		if ( array() === $value ) {
			return (object) array();
		}
	}

	return $value;
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
 * Exposes the fields registered on the server on the `fields_api_init` action.
 *
 * @see Gutenberg_REST_Fields_Controller_7_2
 */
function gutenberg_register_fields_controller_endpoints() {
	$fields_controller = new Gutenberg_REST_Fields_Controller_7_2();
	$fields_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_fields_controller_endpoints' );

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
