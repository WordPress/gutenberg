<?php
/**
 * Widget Types: server-side registry and REST exposure.
 *
 * Hydrates `WP_Widget_Type_Registry` from the build manifest at `init`,
 * and exposes the registry to the client through the
 * `/wp/v2/widget-modules` REST endpoint. The JS layer reads the endpoint
 * via core-data and dynamically imports each widget's render module on
 * the consumer side.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/class-wp-widget-type.php';
require_once __DIR__ . '/class-wp-widget-type-registry.php';
require_once __DIR__ . '/class-wp-rest-widget-modules-controller.php';

/**
 * Returns the i18n schema describing which widget metadata fields are
 * translatable and the gettext context to use for each.
 *
 * Read once from widget-i18n.json and memoized for the rest of the request.
 * Decoded as objects, not associative arrays: that is how
 * `translate_settings_using_i18n_schema()` tells keyed maps apart from
 * lists.
 *
 * @return object Map of translatable field name to gettext context.
 */
function gutenberg_get_widget_metadata_i18n_schema() {
	static $i18n_schema = null;

	if ( null === $i18n_schema ) {
		$schema      = wp_json_file_decode( __DIR__ . '/widget-i18n.json' );
		$i18n_schema = is_object( $schema ) ? $schema : new stdClass();
	}

	return $i18n_schema;
}

/**
 * Translates a widget's user-facing metadata strings.
 *
 * Runs `title`, `description`, `help`, `actions`, and `keywords` through the
 * widget i18n schema using the widget's `textdomain`, leaving every other key
 * untouched. A no-op when the widget declares no `textdomain`.
 *
 * @param array $widget Widget data from the build manifest.
 * @return array Widget data with its translatable strings localized.
 */
function gutenberg_translate_widget_metadata( $widget ) {
	$textdomain = $widget['textdomain'] ?? null;
	if ( ! $textdomain ) {
		return $widget;
	}

	$i18n_schema = gutenberg_get_widget_metadata_i18n_schema();

	foreach ( array( 'title', 'description', 'help', 'actions', 'keywords' ) as $field ) {
		if ( isset( $widget[ $field ], $i18n_schema->$field ) ) {
			$widget[ $field ] = translate_settings_using_i18n_schema( $i18n_schema->$field, $widget[ $field ], $textdomain );
		}
	}

	return $widget;
}

/**
 * Constrains a widget help note to its allowed shape: `content` keeps
 * only `em`/`strong` markup, and links are dropped unless they carry a
 * `label` and an `href` that survives `esc_url_raw()`.
 *
 * @param array|null $help Help note from the build manifest.
 * @return array|null Sanitized help note, or null when there is no content.
 */
function gutenberg_sanitize_widget_help( $help ) {
	if ( ! is_array( $help ) || empty( $help['content'] ) || ! is_string( $help['content'] ) ) {
		return null;
	}

	$sanitized = array(
		'content' => wp_kses(
			$help['content'],
			array(
				'em'     => array(),
				'strong' => array(),
			)
		),
	);

	if ( ! empty( $help['links'] ) && is_array( $help['links'] ) ) {
		$links = array();
		foreach ( $help['links'] as $link ) {
			if ( is_array( $link ) && ! empty( $link['label'] ) && ! empty( $link['href'] ) ) {
				$href = esc_url_raw( $link['href'] );

				if ( $href ) {
					$links[] = array(
						'label' => $link['label'],
						'href'  => $href,
					);
				}
			}
		}

		if ( $links ) {
			$sanitized['links'] = $links;
		}
	}

	return $sanitized;
}

/**
 * Resolves a widget-local file href to a plugin URL.
 *
 * Leaves absolute, scheme-relative, root-relative, and single-segment admin
 * `.php` hrefs unchanged. Returns '' for local path traversal and for
 * relative hrefs that are not a file under `widgets/{dir}/` (so
 * `esc_url_raw()` cannot invent `http://filename`). Query strings on local
 * filenames are not stripped: `report.csv?v=2` will not resolve as a file.
 *
 * @param string $href     Action href.
 * @param string $dir_name Widget directory name.
 * @return string Plugin URL, original href, or ''.
 */
function gutenberg_resolve_widget_action_href( $href, $dir_name ) {
	if ( ! is_string( $href ) || '' === $href ) {
		return '';
	}

	// Absolute, scheme-relative, or schemed — including URLs with `..` in the path.
	if ( preg_match( '#^([a-z][a-z0-9+.-]*:)?//#i', $href ) || str_contains( $href, ':' ) ) {
		return $href;
	}

	// Root-relative paths (e.g. /wp-admin/…, /report.csv).
	if ( str_starts_with( $href, '/' ) ) {
		return $href;
	}

	if ( str_contains( $href, '..' ) ) {
		return '';
	}

	$path_only = preg_split( '/[?#]/', $href, 2 )[0];
	if ( str_ends_with( strtolower( $path_only ), '.php' ) ) {
		// Single-segment admin entry points stay as-is. Deeper relative
		// paths would come out of `esc_url_raw()` as `http://` URLs, and
		// PHP files never resolve as local widget assets.
		return str_contains( $path_only, '/' ) ? '' : $href;
	}

	if ( ! is_string( $dir_name ) || '' === $dir_name ) {
		return '';
	}

	$candidate = 'widgets/' . $dir_name . '/' . $href;

	if ( is_file( gutenberg_dir_path() . $candidate ) ) {
		return gutenberg_url( $candidate );
	}

	return '';
}

/**
 * Sanitizes widget actions to `id` / `label` / `href` (via `esc_url_raw()`),
 * plus optional `download` / `openInNewTab` / `icon` / `relevance`. Drops
 * incomplete or unsafe entries; dropped hrefs are reported through
 * `_doing_it_wrong()`. With `$dir_name`, resolves widget-local file hrefs
 * first. A malformed `icon` or `relevance` drops the key, never the action.
 *
 * This is the registration gate for manifest-sourced widget types. Definitions
 * registered only on the client do not pass through it; any future CPT/API
 * source should reuse this helper at that boundary.
 *
 * @param array|null $actions  Actions from the build manifest.
 * @param string     $dir_name Optional widget directory for local asset hrefs.
 * @return array|null Sanitized actions, or null.
 */
function gutenberg_sanitize_widget_actions( $actions, $dir_name = '' ) {
	if ( ! is_array( $actions ) ) {
		return null;
	}

	$sanitized = array();
	foreach ( $actions as $action ) {
		if (
			! is_array( $action ) ||
			! isset( $action['id'], $action['label'], $action['href'] ) ||
			! is_string( $action['id'] ) ||
			! is_string( $action['label'] ) ||
			! is_string( $action['href'] ) ||
			'' === $action['id'] ||
			'' === $action['label'] ||
			'' === $action['href']
		) {
			continue;
		}

		$href = gutenberg_resolve_widget_action_href( $action['href'], $dir_name );
		$href = esc_url_raw( $href );
		if ( ! $href ) {
			_doing_it_wrong(
				__FUNCTION__,
				sprintf(
					/* translators: 1: Widget action id. 2: Declared action href. */
					__( 'Dropped widget action "%1$s": href "%2$s" is neither an allowed URL nor an existing widget file.', 'gutenberg' ),
					$action['id'],
					$action['href']
				),
				'23.7.0'
			);
			continue;
		}

		$entry = array(
			'id'    => $action['id'],
			'label' => $action['label'],
			'href'  => $href,
		);

		if ( isset( $action['download'] ) ) {
			if ( is_bool( $action['download'] ) ) {
				$entry['download'] = $action['download'];
			} else {
				$filename = sanitize_file_name( (string) $action['download'] );
				if ( $filename ) {
					$entry['download'] = $filename;
				}
			}
		}

		if ( isset( $action['openInNewTab'] ) ) {
			$entry['openInNewTab'] = (bool) $action['openInNewTab'];
		}

		if ( isset( $action['icon'] ) ) {
			$icon = gutenberg_sanitize_widget_icon( $action['icon'] );
			if ( $icon ) {
				$entry['icon'] = $icon;
			}
		}

		if ( isset( $action['relevance'] ) && in_array( $action['relevance'], array( 'high', 'low' ), true ) ) {
			$entry['relevance'] = $action['relevance'];
		}

		$sanitized[] = $entry;
	}

	return $sanitized ? $sanitized : null;
}

/**
 * Constrains a widget icon reference to a registered icon name
 * (`collection/icon-name`). Anything else drops silently, so authoring
 * forms not accepted yet degrade to no icon rather than warn.
 *
 * @param string|null $icon Icon reference from the build manifest.
 * @return string|null The icon name, or null when the shape does not match.
 */
function gutenberg_sanitize_widget_icon( $icon ) {
	if ( ! is_string( $icon ) || '' === $icon ) {
		return null;
	}

	if ( ! preg_match( '#^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?/[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$#', $icon ) ) {
		return null;
	}

	return $icon;
}

/**
 * Hydrates the widget type registry from the build manifest.
 *
 * Iterates the widgets discovered by the build pipeline (via
 * `gutenberg_get_registered_widget_modules()`) and registers each one in
 * `WP_Widget_Type_Registry`. The manifest is the single source of widget
 * authorship in this codebase; this loop is a deterministic copy of it
 * into the in-memory registry, with no filters in between.
 */
function gutenberg_register_widget_types() {
	if ( ! function_exists( 'gutenberg_get_registered_widget_modules' ) ) {
		return;
	}

	$registry = WP_Widget_Type_Registry::get_instance();

	foreach ( gutenberg_get_registered_widget_modules() as $widget ) {
		if ( empty( $widget['name'] ) || $registry->is_registered( $widget['name'] ) ) {
			continue;
		}

		$widget = gutenberg_translate_widget_metadata( $widget );

		$registry->register(
			$widget['name'],
			array(
				'render_module' => $widget['render_module'] ?? null,
				'widget_module' => $widget['widget_module'] ?? null,
				'presentation'  => $widget['presentation'] ?? null,
				'category'      => $widget['category'] ?? null,
				'title'         => $widget['title'] ?? null,
				'description'   => $widget['description'] ?? null,
				'help'          => gutenberg_sanitize_widget_help( $widget['help'] ?? null ),
				'icon'          => gutenberg_sanitize_widget_icon( $widget['icon'] ?? null ),
				'actions'       => gutenberg_sanitize_widget_actions(
					$widget['actions'] ?? null,
					$widget['dir_name'] ?? ''
				),
				'keywords'      => $widget['keywords'] ?? null,
			)
		);
	}
}

if ( did_action( 'init' ) ) {
	gutenberg_register_widget_types();
} else {
	add_action( 'init', 'gutenberg_register_widget_types' );
}

/**
 * Returns all widget types registered in the widget type registry.
 *
 * Convenience accessor around `WP_Widget_Type_Registry::get_all_registered()`
 * for callers that prefer a function-based API.
 *
 * @return WP_Widget_Type[] Associative array of `$name => $widget_type`
 *                          pairs.
 */
function gutenberg_get_registered_widget_types() {
	return WP_Widget_Type_Registry::get_instance()->get_all_registered();
}

/**
 * Registers the REST controller that exposes the widget type registry.
 */
function gutenberg_register_widget_modules_rest_controller() {
	$controller = new WP_REST_Widget_Modules_Controller();
	$controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_widget_modules_rest_controller' );

/**
 * Adds the registered widget modules to the dashboard page's boot
 * dependencies.
 *
 * The wp-build page templates expose a generic
 * `{page-id}-wp-admin_boot_dependencies` filter. The dashboard hooks
 * it to make every registered widget render and metadata module
 * available in the page's import map for dynamic `import()` calls.
 *
 * Both the render module and the metadata module are added as
 * 'dynamic' dependencies so they are reachable from the import map but
 * not eagerly executed.
 *
 * @param array $boot_dependencies Boot dependencies for the page.
 * @return array Updated boot dependencies.
 */
function gutenberg_add_widget_modules_to_dashboard_boot_deps( $boot_dependencies ) {
	foreach ( gutenberg_get_registered_widget_types() as $widget_type ) {
		if ( $widget_type->render_module ) {
			$boot_dependencies[] = array(
				'import' => 'dynamic',
				'id'     => $widget_type->render_module,
			);
		}
		if ( $widget_type->widget_module ) {
			$boot_dependencies[] = array(
				'import' => 'dynamic',
				'id'     => $widget_type->widget_module,
			);
		}
	}

	return $boot_dependencies;
}
add_filter( 'dashboard-wp-admin_boot_dependencies', 'gutenberg_add_widget_modules_to_dashboard_boot_deps' );
