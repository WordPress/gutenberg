<?php
/**
 * Boot package route registration API.
 *
 * @package gutenberg
 */

/**
 * Registered routes storage.
 *
 * @var array
 */
global $gutenberg_boot_routes;
$gutenberg_boot_routes = array();

/**
 * Register a boot route.
 *
 * @param string $path           Route path (e.g., "/").
 * @param string $content_module Script module ID for route content (stage/inspector).
 * @param string $route_module   Optional script module ID for route lifecycle (beforeLoad/loader).
 */
function gutenberg_register_boot_route( $path, $content_module, $route_module = null ) {
	global $gutenberg_boot_routes;

	$route = array(
		'path'           => $path,
		'content_module' => $content_module,
	);

	// Only include route_module if it's not empty.
	if ( ! empty( $route_module ) ) {
		$route['route_module'] = $route_module;
	}

	$gutenberg_boot_routes[] = $route;
}

/**
 * Get all registered boot routes.
 *
 * @return array Array of registered routes.
 */
function gutenberg_get_boot_routes() {
	global $gutenberg_boot_routes;
	return $gutenberg_boot_routes;
}
