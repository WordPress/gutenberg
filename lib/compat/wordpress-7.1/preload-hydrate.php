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
				case 'root':
					// Site entity: loadSiteEntity reads its config from
					// the /wp/v2/settings schema via OPTIONS.
					return array(
						'path'   => '/wp/v2/settings',
						'method' => 'OPTIONS',
					);
			}
			return null;

		case 'getEntityRecord':
			// args: [ kind, name, key? ]. Mirrors @wordpress/core-data's
			// getEntityRecord resolver, which appends `?context=$ctx` to
			// the entity's baseURL/key. The site entity has key=false,
			// so its preload only needs [ kind, name ].
			if ( count( $args ) < 2 ) {
				return null;
			}
			list( $kind, $entity_name ) = $args;
			$key                        = isset( $args[2] ) ? $args[2] : null;

			if ( 'root' === $kind && 'site' === $entity_name ) {
				// Site settings: GET on the same endpoint that
				// `getEntitiesConfig( 'root' )` reads via OPTIONS.
				return array(
					'path'   => '/wp/v2/settings',
					'method' => 'GET',
				);
			}

			if ( null === $key ) {
				return null;
			}

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

			if ( 'root' === $kind && 'globalStyles' === $entity_name ) {
				// The user's global-styles record. `edit` context is only
				// returnable to users who can edit theme options;
				// everyone else gets the `view` projection.
				$global_styles_ctx = current_user_can( 'edit_theme_options' )
					? 'edit'
					: 'view';
				return array(
					'path'   => add_query_arg(
						'context',
						$global_styles_ctx,
						sprintf( '/wp/v2/global-styles/%d', (int) $key )
					),
					'method' => 'GET',
				);
			}

			return null;

		case 'getAutosaves':
			// args: [ postType, postId ]. The resolver builds the path from
			// the post type's REST base; we re-derive it via the post's
			// canonical REST route and tack `/autosaves?context=edit` on.
			if ( count( $args ) < 2 ) {
				return null;
			}
			$post = get_post( $args[1] );
			if ( ! $post || $post->post_type !== $args[0] ) {
				return null;
			}
			$post_route = rest_get_route_for_post( $post );
			if ( empty( $post_route ) ) {
				return null;
			}
			return array(
				'path'   => sprintf( '%s/autosaves?context=edit', $post_route ),
				'method' => 'GET',
			);

		case 'getCurrentTheme':
			// Resolver internally fetches the active theme via
			// `getEntityRecords( 'root', 'theme', { status: 'active' } )`
			// and dispatches the [0] entry as the current theme.
			return array(
				'path'   => '/wp/v2/themes?context=edit&status=active',
				'method' => 'GET',
			);

		case 'getBlockPatternCategories':
			return array(
				'path'   => '/wp/v2/block-patterns/categories',
				'method' => 'GET',
			);

		case '__experimentalGetCurrentGlobalStylesId':
			// The resolver normally derives this from the active theme's
			// `_links[ 'wp:user-global-styles' ]` URL. PHP has the same
			// value directly, so we can short-circuit the entire REST
			// dance and just hand the value to the hydrator. Returning a
			// `data` key bypasses the REST request and emits the value
			// directly into the payload.
			if ( ! class_exists( 'WP_Theme_JSON_Resolver' ) ) {
				return null;
			}
			$id = WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
			if ( ! $id ) {
				return null;
			}
			return array( 'data' => (int) $id );

		case '__experimentalGetCurrentThemeBaseGlobalStyles':
		case '__experimentalGetCurrentThemeGlobalStylesVariations':
			// Both resolvers take no args; the resolver itself looks up
			// the current theme's stylesheet via `getCurrentTheme`. PHP
			// knows the active stylesheet directly.
			$stylesheet = get_stylesheet();
			if ( empty( $stylesheet ) ) {
				return null;
			}
			$suffix = '__experimentalGetCurrentThemeGlobalStylesVariations' === $name
				? '/variations'
				: '';
			return array(
				'path'   => sprintf(
					'/wp/v2/global-styles/themes/%s%s?context=view',
					$stylesheet,
					$suffix
				),
				'method' => 'GET',
			);

		case 'canUser':
			// args: [ action, resource, id? ]. The resolver issues an
			// OPTIONS to the resource's REST URL and parses the Allow
			// header. We wire the object-form `{ kind, name, id? }` for
			// the entity kinds we know the REST base of from PHP.
			// String-form callers like `canUser( 'create', 'media' )`
			// would resolve to the same HTTP request but under a different
			// store-cache key, so they'd need their own spec.
			if ( count( $args ) < 2 ) {
				return null;
			}
			$resource    = $args[1];
			$resource_id = isset( $args[2] ) ? $args[2] : null;
			if (
				! is_array( $resource ) ||
				! isset( $resource['kind'], $resource['name'] )
			) {
				return null;
			}

			if (
				'postType' === $resource['kind'] &&
				post_type_exists( $resource['name'] )
			) {
				$base = rest_get_route_for_post_type_items( $resource['name'] );
			} elseif (
				'root' === $resource['kind'] &&
				'globalStyles' === $resource['name']
			) {
				$base = '/wp/v2/global-styles';
			} else {
				return null;
			}

			$id   = isset( $resource['id'] ) ? $resource['id'] : $resource_id;
			$path = null !== $id ? $base . '/' . $id : $base;
			return array(
				'path'   => $path,
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
	$paths   = array();
	$by_key  = array();
	$payload = array();

	foreach ( $specs as $spec ) {
		$req = gutenberg_resolve_preload_spec( $spec );
		if ( ! $req ) {
			continue;
		}

		// Selectors whose value PHP can compute directly bypass REST
		// entirely — they return `{ data: ... }` and we emit the entry
		// straight away.
		if ( array_key_exists( 'data', $req ) ) {
			$payload[] = array(
				'selector' => $spec['selector'],
				'args'     => array_values( $spec['args'] ?? array() ),
				'data'     => $req['data'],
			);
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

	// The two theme-global-styles selectors take no args, but their
	// receive-actions need the stylesheet (the resolver normally pulls
	// it from `getCurrentTheme`). Pass it inline.
	if (
		'__experimentalGetCurrentThemeBaseGlobalStyles' === $spec['selector'] ||
		'__experimentalGetCurrentThemeGlobalStylesVariations' === $spec['selector']
	) {
		$entry['stylesheet'] = get_stylesheet();
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
		array(
			'selector' => 'getEntitiesConfig',
			'args'     => array( 'root' ),
		),
		array(
			'selector' => 'getEntityRecord',
			'args'     => array( 'root', 'site' ),
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
		$specs[] = array(
			'selector' => 'getAutosaves',
			'args'     => array( $context->post->post_type, $context->post->ID ),
		);
	}

	$specs[] = array(
		'selector' => 'getCurrentTheme',
		'args'     => array(),
	);
	$specs[] = array(
		'selector' => 'getBlockPatternCategories',
		'args'     => array(),
	);
	$specs[] = array(
		'selector' => '__experimentalGetCurrentGlobalStylesId',
		'args'     => array(),
	);

	// Theme global styles: both base + variations are tied to the
	// active stylesheet, which PHP knows directly.
	$specs[] = array(
		'selector' => '__experimentalGetCurrentThemeBaseGlobalStyles',
		'args'     => array(),
	);
	$specs[] = array(
		'selector' => '__experimentalGetCurrentThemeGlobalStylesVariations',
		'args'     => array(),
	);

	// The user's global-styles record + the canUser OPTIONS for it.
	if ( class_exists( 'WP_Theme_JSON_Resolver' ) ) {
		$user_global_styles_id =
			WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
		if ( $user_global_styles_id ) {
			$specs[] = array(
				'selector' => 'getEntityRecord',
				'args'     => array( 'root', 'globalStyles', $user_global_styles_id ),
			);
			$specs[] = array(
				'selector' => 'canUser',
				'args'     => array(
					'read',
					array(
						'kind' => 'root',
						'name' => 'globalStyles',
						'id'   => $user_global_styles_id,
					),
				),
			);
		}
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
 * payload and clear the legacy path list entirely.
 *
 * Runs at priority 100 so it sees the final path list (after Gutenberg's
 * own filters at default priority).
 *
 * The hydration payload covers everything the editor needs at boot via
 * the new selector-keyed flow. Anything not in the hydration set falls
 * through to a regular `apiFetch` round-trip — clearer signal than a
 * mostly-empty preload, and any remaining startup fetches surface as a
 * concrete to-do for migration.
 *
 * @param array                   $paths   Paths the legacy helper is about to preload.
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array
 */
function gutenberg_hydrate_and_clear_preload_paths( $paths, $context ) {
	static $done = false;
	if ( $done ) {
		return $paths;
	}
	$done = true;

	$specs = gutenberg_get_preload_hydration_specs( $context );
	gutenberg_emit_preload_hydration( $specs );

	return array();
}
add_filter(
	'block_editor_rest_api_preload_paths',
	'gutenberg_hydrate_and_clear_preload_paths',
	100,
	2
);
