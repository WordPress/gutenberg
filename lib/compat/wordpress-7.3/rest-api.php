<?php
/**
 * WordPress 7.3 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Registers the `author` parameter on autosave collection routes.
 *
 * WordPress 7.3 registers the parameter itself, in which case the route is
 * left as is.
 *
 * @since 7.3.0
 *
 * @see https://core.trac.wordpress.org/ticket/62057
 *
 * @param array<string, array<mixed>> $endpoints Registered routes and their handlers.
 * @return array<string, array<mixed>> Filtered routes.
 */
function gutenberg_register_autosaves_author_param( $endpoints ) {
	foreach ( $endpoints as $route => $handlers ) {
		if ( ! str_ends_with( $route, '/autosaves' ) ) {
			continue;
		}

		foreach ( $handlers as $key => $handler ) {
			if ( ! is_array( $handler ) ) {
				continue;
			}

			$callback = $handler['callback'] ?? null;
			$args     = $handler['args'] ?? array();

			if (
				! is_array( $callback ) ||
				! ( $callback[0] ?? null ) instanceof WP_REST_Autosaves_Controller ||
				'get_items' !== ( $callback[1] ?? null ) ||
				! is_array( $args ) ||
				isset( $args['author'] )
			) {
				continue;
			}

			// A controller with its own `get_items()` keeps answering for itself.
			$get_items = new ReflectionMethod( $callback[0], 'get_items' );
			if ( WP_REST_Autosaves_Controller::class !== $get_items->getDeclaringClass()->getName() ) {
				continue;
			}

			$args['author'] = array(
				'description' => __( 'Limit result set to autosaves assigned to specific authors.', 'gutenberg' ),
				'type'        => 'array',
				'items'       => array(
					'type'    => 'integer',
					'minimum' => 1,
				),
				'default'     => array(),
			);

			$handler['args'] = $args;
			// Marks the handler for gutenberg_get_autosaves_by_author().
			$handler['gutenberg_autosaves_author'] = true;

			$handlers[ $key ] = $handler;
		}

		$endpoints[ $route ] = $handlers;
	}

	return $endpoints;
}
add_filter( 'rest_endpoints', 'gutenberg_register_autosaves_author_param' );

/**
 * Answers an autosave collection request that is scoped by author.
 *
 * Queries the requested authors' autosaves directly, as WordPress 7.3 does,
 * rather than loading every revision of the parent post. Requests without
 * `author` fall through to the controller.
 *
 * @since 7.3.0
 *
 * @see https://core.trac.wordpress.org/ticket/62057
 *
 * @param mixed                $dispatch_result Dispatch result, will be used if not empty.
 * @param WP_REST_Request      $request         Request used to generate the response.
 * @param string               $route           Route matched for the request.
 * @param array<string, mixed> $handler         Route handler used for the request.
 * @return mixed The autosave collection, or the unchanged dispatch result.
 */
function gutenberg_get_autosaves_by_author( $dispatch_result, $request, $route, $handler ) {
	$author_ids = $request['author'];

	if (
		null !== $dispatch_result ||
		empty( $handler['gutenberg_autosaves_author'] ) ||
		! is_array( $author_ids ) ||
		! $author_ids ||
		$request->is_method( 'HEAD' )
	) {
		return $dispatch_result;
	}

	$controller = is_array( $handler['callback'] ) ? $handler['callback'][0] : null;
	// The permission callback has already checked access to the parent.
	$parent = is_numeric( $request['id'] ) ? get_post( (int) $request['id'] ) : null;

	if ( ! $controller instanceof WP_REST_Autosaves_Controller || ! $parent ) {
		return $dispatch_result;
	}

	$autosaves = get_posts(
		array(
			'post_type'        => 'revision',
			'post_status'      => 'inherit',
			'post_parent'      => $parent->ID,
			// Unlike `name`, this does not make the query singular.
			'post_name__in'    => array( $parent->ID . '-autosave-v1' ),
			'author__in'       => wp_parse_id_list( $author_ids ),
			'orderby'          => array(
				'date' => 'DESC',
				'ID'   => 'DESC',
			),
			'posts_per_page'   => -1,
			'suppress_filters' => true,
		)
	);

	$response     = array();
	$seen_authors = array();

	// Each author has at most one autosave; keep only the newest if not.
	foreach ( $autosaves as $autosave ) {
		if ( in_array( $autosave->post_author, $seen_authors, true ) ) {
			continue;
		}
		$seen_authors[] = $autosave->post_author;

		$data       = $controller->prepare_item_for_response( $autosave, $request );
		$response[] = $controller->prepare_response_for_collection( $data );
	}

	return rest_ensure_response( $response );
}
add_filter( 'rest_dispatch_request', 'gutenberg_get_autosaves_by_author', 10, 4 );
