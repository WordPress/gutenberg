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
 * Resolves an action href that points at a file shipped beside the widget.
 *
 * Paths that exist under `widgets/{dir_name}/` become plugin URLs via
 * `gutenberg_url()`. Absolute URLs, admin-relative targets like
 * `site-health.php`, and anything that is not a file in that folder pass
 * through unchanged. Path traversal attempts yield an empty string so the
 * sanitizer can drop them.
 *
 * @param string $href     Action href from the build manifest.
 * @param string $dir_name Widget directory name from the build manifest.
 * @return string Absolute plugin URL, the original href, or an empty string.
 */
function gutenberg_resolve_widget_action_href( $href, $dir_name ) {
	if ( ! is_string( $href ) || '' === $href || ! is_string( $dir_name ) || '' === $dir_name ) {
		return $href;
	}

	if ( str_contains( $href, '..' ) ) {
		return '';
	}

	// Absolute, scheme-relative, or schemed URLs are already complete.
	if ( preg_match( '#^([a-z][a-z0-9+.-]*:)?//#i', $href ) || str_contains( $href, ':' ) ) {
		return $href;
	}

	$relative = ltrim( $href, '/' );
	$path     = gutenberg_dir_path() . 'widgets/' . $dir_name . '/' . $relative;

	if ( ! is_file( $path ) ) {
		return $href;
	}

	return gutenberg_url( 'widgets/' . $dir_name . '/' . $relative );
}

/**
 * Constrains a widget's actions to their allowed shape: each entry keeps
 * `id`, `label`, and an `href` that survives `esc_url_raw()`; entries that
 * fail those checks are dropped. Optional `download` and `openInNewTab`
 * are copied when present. String `download` values are passed through
 * `sanitize_file_name()`.
 *
 * When `$dir_name` is provided, hrefs that name a file under the widget's
 * folder are rewritten to plugin URLs before sanitization.
 *
 * @param array|null $actions  Actions from the build manifest.
 * @param string     $dir_name Optional. Widget directory name used to resolve
 *                             widget-local asset hrefs.
 * @return array|null Sanitized actions, or null when there are none.
 */
function gutenberg_sanitize_widget_actions( $actions, $dir_name = '' ) {
	if ( ! is_array( $actions ) ) {
		return null;
	}

	$sanitized = array();
	foreach ( $actions as $action ) {
		if (
			! is_array( $action ) ||
			empty( $action['id'] ) ||
			empty( $action['label'] ) ||
			empty( $action['href'] )
		) {
			continue;
		}

		$href = gutenberg_resolve_widget_action_href( $action['href'], $dir_name );
		$href = esc_url_raw( $href );
		if ( ! $href ) {
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

		$sanitized[] = $entry;
	}

	return $sanitized ? $sanitized : null;
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
