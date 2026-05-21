<?php
/**
 * Selector-keyed preload hydration for the block editor.
 *
 * Sits alongside `block_editor_rest_api_preload()` and the existing
 * path-based `createPreloadingMiddleware` flow. Where that helper emits a
 * map of `{ path: response }` for `wp.apiFetch` to short-circuit, this one
 * emits the same data already labeled with the resolver call it satisfies,
 * so the `@wordpress/core-data` store can fold it directly into its
 * initial state (no dispatch, no subscriber notification, no `setTimeout(0)`
 * resolver setup).
 *
 * Migration is incremental: a selector lives in either the old or the new
 * world, never both. {@see gutenberg_strip_hydrated_preload_paths} removes
 * any path the new helper covered from the legacy path list.
 *
 * @package gutenberg
 */

/**
 * Translate a selector spec into a REST request descriptor.
 *
 * @param array $spec Selector spec: array(
 *                      'selector' => string,
 *                      'args'     => array,
 *                      'context'  => string (optional, defaults to 'edit'),
 *                    ).
 * @return array|null array( 'path' => string, 'method' => string ) or null
 *                    if the selector is not (yet) preloadable.
 */
function gutenberg_resolve_preload_spec( array $spec ) {
	$name = isset( $spec['selector'] ) ? $spec['selector'] : '';
	$args = isset( $spec['args'] ) ? $spec['args'] : array();
	$ctx  = isset( $spec['context'] ) ? $spec['context'] : 'edit';

	switch ( $name ) {
		case 'getCurrentUser':
			// Mirror @wordpress/core-data's getCurrentUser resolver: it
			// calls apiFetch({ path: '/wp/v2/users/me' }) without a context.
			return array(
				'path'   => '/wp/v2/users/me',
				'method' => 'GET',
			);

		case 'getEntitiesConfig':
			// args: [ kind ]. Each kind has its own loader hitting a fixed
			// REST list endpoint at `context=view`. The JS-side hydrator
			// runs the response through the matching `XEntitiesFromResponse`
			// transform to produce addEntities configs.
			if ( empty( $args ) ) {
				return null;
			}
			switch ( $args[0] ) {
				case 'postType':
					return array(
						'path'   => '/wp/v2/types?context=view',
						'method' => 'GET',
					);
				case 'taxonomy':
					return array(
						'path'   => '/wp/v2/taxonomies?context=view',
						'method' => 'GET',
					);
			}
			return null;

		case 'getEntityRecord':
			// args: [ kind, name, key ]. Mirrors @wordpress/core-data's
			// getEntityRecord resolver, which appends `?context=$ctx` to
			// the entity's baseURL/key.
			if ( count( $args ) < 3 ) {
				return null;
			}
			list( $kind, $entity_name, $key ) = $args;

			if ( 'postType' === $kind ) {
				$post = get_post( $key );
				if ( ! $post ) {
					return null;
				}
				return array(
					'path'   => add_query_arg(
						'context',
						$ctx,
						rest_get_route_for_post( $post )
					),
					'method' => 'GET',
				);
			}

			if ( 'root' === $kind && 'postType' === $entity_name ) {
				// A single post-type definition, keyed by its slug.
				if ( ! post_type_exists( $key ) ) {
					return null;
				}
				return array(
					'path'   => add_query_arg(
						'context',
						$ctx,
						sprintf( '/wp/v2/types/%s', $key )
					),
					'method' => 'GET',
				);
			}

			return null;

		case 'canUser':
			// args: [ action, resource, id? ]. The resolver issues an
			// OPTIONS to the resource's REST URL and parses the Allow
			// header. We only wire the object-form `{ kind, name }` for
			// postType entities here (string-form callers like
			// `canUser( 'create', 'media' )` would resolve to the same
			// HTTP request but under a different store-cache key, so
			// they'd need their own spec to be hydrated).
			if ( count( $args ) < 2 ) {
				return null;
			}
			$resource = $args[1];
			if (
				! is_array( $resource ) ||
				! isset( $resource['kind'], $resource['name'] ) ||
				'postType' !== $resource['kind'] ||
				! post_type_exists( $resource['name'] )
			) {
				return null;
			}
			return array(
				'path'   => rest_get_route_for_post_type_items( $resource['name'] ),
				'method' => 'OPTIONS',
			);
	}

	return null;
}

/**
 * Build a hydration payload from a list of selector specs by reusing the
 * existing `rest_preload_api_request` machinery (nonces, internal REST
 * dispatch, response_to_data).
 *
 * @param array $specs Array of selector specs.
 * @return array       Hydration payload: array of array(
 *                       'selector' => string,
 *                       'args'     => array,
 *                       'data'     => mixed,
 *                     ).
 */
function gutenberg_preload_selectors_for_hydration( array $specs ) {
	$paths  = array();
	$by_key = array();

	foreach ( $specs as $spec ) {
		$req = gutenberg_resolve_preload_spec( $spec );
		if ( ! $req ) {
			continue;
		}

		// rest_preload_api_request takes a string for GET or array(path, method)
		// for non-GET, and keys its result as either $memo[$path] (GET) or
		// $memo[$method][$path] (non-GET).
		if ( 'GET' === $req['method'] ) {
			$paths[] = $req['path'];
		} else {
			$paths[] = array( $req['path'], $req['method'] );
		}
		$by_key[ gutenberg_preload_path_key( $req['path'], $req['method'] ) ] = $spec;
	}

	$preloaded = array_reduce( $paths, 'rest_preload_api_request', array() );

	$payload = array();
	// GET responses sit at the top level keyed by path. Non-GET responses
	// are nested by method.
	foreach ( $preloaded as $key => $value ) {
		if ( in_array( $key, array( 'OPTIONS', 'POST', 'PUT', 'DELETE', 'PATCH' ), true ) ) {
			foreach ( $value as $path => $response ) {
				$spec = $by_key[ gutenberg_preload_path_key( $path, $key ) ] ?? null;
				if ( $spec && isset( $response['body'] ) ) {
					$payload[] = gutenberg_build_hydration_entry( $spec, $response );
				}
			}
			continue;
		}

		$spec = $by_key[ gutenberg_preload_path_key( $key ) ] ?? null;
		if ( $spec && isset( $value['body'] ) ) {
			$payload[] = gutenberg_build_hydration_entry( $spec, $value );
		}
	}

	return $payload;
}

/**
 * Compose a single hydration entry from a (spec, REST response) pair.
 *
 * For `getEntityRecord` we also pull the `Allow` response header into the
 * entry — the JS-side resolver normally reads it to prime every
 * `canUser( action, { kind, name, id } )` resolution at the same time as
 * the record. Without it, those canUser selectors would later issue
 * their own OPTIONS requests for permissions we already know.
 *
 * @param array $spec     Selector spec.
 * @param array $response REST response (`{ body, headers }`).
 * @return array Hydration entry: `{ selector, args, data, allow? }`.
 */
function gutenberg_build_hydration_entry( $spec, $response ) {
	$entry = array(
		'selector' => $spec['selector'],
		'args'     => array_values( $spec['args'] ?? array() ),
		'data'     => $response['body'],
	);

	// Both `getEntityRecord` and `canUser` derive their canUser permissions
	// from the REST response's `Allow` header. Forward it so the JS-side
	// hydrator can fan it out across the four ALLOWED_RESOURCE_ACTIONS
	// without issuing a separate OPTIONS request.
	if (
		'getEntityRecord' === $spec['selector'] ||
		'canUser' === $spec['selector']
	) {
		$allow = $response['headers']['Allow'] ?? null;
		if ( null !== $allow ) {
			$entry['allow'] = $allow;
		}
	}

	return $entry;
}

/**
 * Emit the hydration payload as a `before` inline script on the
 * `wp-core-data` handle so it lands on `window.__wpCoreDataPreload`
 * before the package's top-level `register()` runs.
 *
 * @param array $specs Selector specs to preload.
 */
function gutenberg_emit_preload_hydration( array $specs ) {
	$payload = gutenberg_preload_selectors_for_hydration( $specs );
	if ( empty( $payload ) ) {
		return;
	}

	wp_add_inline_script(
		'wp-core-data',
		sprintf(
			'window.__wpCoreDataPreload = %s;',
			wp_json_encode( $payload )
		),
		'before'
	);

	// Remember the paths we covered so the legacy preload filter can skip
	// them. Stored on a global because the filter runs in a separate hook
	// call (block editor settings filtering).
	if ( ! isset( $GLOBALS['gutenberg_hydrated_preload_path_keys'] ) ) {
		$GLOBALS['gutenberg_hydrated_preload_path_keys'] = array();
	}
	foreach ( $specs as $spec ) {
		$req = gutenberg_resolve_preload_spec( $spec );
		if ( ! $req ) {
			continue;
		}
		$GLOBALS['gutenberg_hydrated_preload_path_keys'][] = gutenberg_preload_path_key(
			$req['path'],
			$req['method']
		);
	}
}

/**
 * Build a stable key for a (path, method) pair, used to match legacy
 * preload entries against entries we've already hydrated.
 *
 * @param string $path   REST path.
 * @param string $method HTTP method.
 * @return string
 */
function gutenberg_preload_path_key( $path, $method = 'GET' ) {
	return $method . ' ' . $path;
}

/**
 * Returns the selector specs to hydrate for a given editor context. Filter
 * point for callers (and the editor packages) to register additional
 * preloadable resolvers.
 *
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array
 */
function gutenberg_get_preload_hydration_specs( $context ) {
	$specs = array(
		array(
			'selector' => 'getCurrentUser',
			'args'     => array(),
		),
		array(
			'selector' => 'getEntitiesConfig',
			'args'     => array( 'postType' ),
		),
		array(
			'selector' => 'getEntitiesConfig',
			'args'     => array( 'taxonomy' ),
		),
	);

	// Permissions on the collection endpoints. Each of these would
	// otherwise issue an OPTIONS request on first `canUser( 'create',
	// { kind: 'postType', name: $type } )` call to read the Allow header.
	foreach ( array( 'attachment', 'page', 'wp_block', 'wp_template' ) as $post_type ) {
		if ( ! post_type_exists( $post_type ) ) {
			continue;
		}
		$specs[] = array(
			'selector' => 'canUser',
			'args'     => array(
				'create',
				array(
					'kind' => 'postType',
					'name' => $post_type,
				),
			),
		);
	}

	// When the editor context exposes a post (the post editor), hydrate
	// the post-type definition AND the record itself so the resolver
	// graph for `getEntityRecord( 'postType', $type, $id )` never fires.
	// Order matters in the payload: the JS-side hydrator processes
	// getEntitiesConfig entries first so the reducer has a slot for the
	// record before RECEIVE_ITEMS lands.
	if ( ! empty( $context->post ) && $context->post instanceof WP_Post ) {
		$specs[] = array(
			'selector' => 'getEntityRecord',
			'args'     => array( 'root', 'postType', $context->post->post_type ),
			'context'  => 'edit',
		);
		$specs[] = array(
			'selector' => 'getEntityRecord',
			'args'     => array( 'postType', $context->post->post_type, $context->post->ID ),
			'context'  => 'edit',
		);
	}

	/**
	 * Filter the list of selector specs hydrated into the @wordpress/core-data
	 * store at editor boot, replacing the equivalent path-based preload entries.
	 *
	 * @param array                   $specs   Selector specs.
	 * @param WP_Block_Editor_Context $context Block editor context.
	 */
	return apply_filters( 'gutenberg_preload_hydration_specs', $specs, $context );
}

/**
 * Hook into the existing path-based preload filter: emit the hydration
 * payload (covering any specs whose corresponding path WP core was about
 * to preload) and strip those paths so the data isn't preloaded twice.
 *
 * Runs at priority 100 so it sees the final path list (after Gutenberg's
 * own filters at default priority).
 *
 * @param array                   $paths   Paths the legacy helper is about to preload.
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array
 */
function gutenberg_hydrate_and_strip_preload_paths( $paths, $context ) {
	static $done = false;
	if ( $done ) {
		return $paths;
	}
	$done = true;

	$specs = gutenberg_get_preload_hydration_specs( $context );
	gutenberg_emit_preload_hydration( $specs );

	if ( empty( $GLOBALS['gutenberg_hydrated_preload_path_keys'] ) ) {
		return $paths;
	}

	$covered = $GLOBALS['gutenberg_hydrated_preload_path_keys'];

	return array_values(
		array_filter(
			$paths,
			static function ( $p ) use ( $covered ) {
				$key = is_array( $p )
					? gutenberg_preload_path_key( $p[0], $p[1] )
					: gutenberg_preload_path_key( $p );
				return ! in_array( $key, $covered, true );
			}
		)
	);
}
add_filter(
	'block_editor_rest_api_preload_paths',
	'gutenberg_hydrate_and_strip_preload_paths',
	100,
	2
);
