<?php
/**
 * Registers the notes-aware REST comments controller.
 *
 * Core builds the comments routes from a hardcoded
 * `new WP_REST_Comments_Controller()` in create_initial_rest_routes(), with no
 * filter for the controller class the way post types have
 * `rest_controller_class`. Re-registering the routes would append a second set
 * of handlers rather than replace the first, so instead the already-registered
 * handlers are rebound to an instance of the subclass. Route definitions,
 * schema and arguments all stay exactly as core registered them.
 *
 * @package gutenberg
 */

/**
 * Points the comments routes at the notes-aware controller.
 *
 * @param array $endpoints The registered REST API endpoints, keyed by route.
 * @return array The registered REST API endpoints, keyed by route.
 */
function gutenberg_notes_preview_swap_comments_controller( $endpoints ) {
	$routes     = array( '/wp/v2/comments', '/wp/v2/comments/(?P<id>[\d]+)' );
	$controller = null;

	foreach ( $routes as $route ) {
		if ( empty( $endpoints[ $route ] ) || ! is_array( $endpoints[ $route ] ) ) {
			continue;
		}

		foreach ( $endpoints[ $route ] as $index => $handler ) {
			// Non-numeric keys are route options such as `namespace` or `schema`.
			if ( ! is_numeric( $index ) || ! is_array( $handler ) ) {
				continue;
			}

			foreach ( array( 'callback', 'permission_callback' ) as $key ) {
				if ( ! isset( $handler[ $key ] ) || ! is_array( $handler[ $key ] ) || ! isset( $handler[ $key ][0] ) ) {
					continue;
				}

				$object = $handler[ $key ][0];

				if ( ! $object instanceof WP_REST_Comments_Controller
					|| $object instanceof Gutenberg_REST_Comments_Controller_Notes
				) {
					continue;
				}

				if ( null === $controller ) {
					$controller = new Gutenberg_REST_Comments_Controller_Notes();
				}

				$endpoints[ $route ][ $index ][ $key ][0] = $controller;
			}
		}
	}

	return $endpoints;
}

add_filter( 'rest_endpoints', 'gutenberg_notes_preview_swap_comments_controller' );
