<?php
/**
 * Legacy Dashboard Widgets: bridges `wp_add_dashboard_widget()` registrations
 * into the experimental widget type registry and iframe preview endpoint.
 *
 * @package gutenberg
 */

/**
 * Returns the script-module handle shared by all legacy dashboard widget types.
 *
 * @return string
 */
function gutenberg_get_legacy_dashboard_render_module() {
	return 'wp/widgets/legacy-dashboard/render';
}

/**
 * Converts a classic dashboard widget id into a namespaced widget type name.
 *
 * @param string $widget_id Dashboard widget id passed to `wp_add_dashboard_widget()`.
 * @return string Widget type name in `wp-legacy/{slug}` form.
 */
function gutenberg_legacy_dashboard_widget_type_name( $widget_id ) {
	$slug = strtolower( (string) $widget_id );
	$slug = str_replace( '_', '-', $slug );
	$slug = preg_replace( '/[^a-z0-9-]+/', '-', $slug );
	$slug = trim( $slug, '-' );

	if ( '' === $slug ) {
		$slug = 'widget';
	}

	return 'wp-legacy/' . $slug;
}

/**
 * Ensures classic dashboard meta boxes are registered for the `dashboard` screen.
 *
 * Plugins register widgets on `wp_dashboard_setup`, which only runs when the
 * classic dashboard loads. The new dashboard surface calls this helper so those
 * registrations are available for discovery and iframe previews.
 */
function gutenberg_ensure_legacy_dashboard_widgets_loaded() {
	static $loaded = false;

	if ( $loaded ) {
		return;
	}

	$loaded = true;

	$should_load = is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST );

	if ( ! $should_load ) {
		return;
	}

	require_once ABSPATH . 'wp-admin/includes/dashboard.php';

	if ( ! function_exists( 'get_current_screen' ) ) {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
	}

	$screen = get_current_screen();
	if ( ! $screen || 'dashboard' !== $screen->id ) {
		set_current_screen( 'dashboard' );
	}

	if ( ! did_action( 'wp_dashboard_setup' ) ) {
		wp_dashboard_setup();
	}
}

/**
 * Returns dashboard meta boxes registered for the `dashboard` screen.
 *
 * @return array<int, array{id: string, title: string, callback: callable, args: mixed}>
 */
function gutenberg_get_legacy_dashboard_meta_boxes() {
	gutenberg_ensure_legacy_dashboard_widgets_loaded();

	global $wp_meta_boxes;

	if ( empty( $wp_meta_boxes['dashboard'] ) || ! is_array( $wp_meta_boxes['dashboard'] ) ) {
		return array();
	}

	$meta_boxes = array();

	foreach ( $wp_meta_boxes['dashboard'] as $context => $priorities ) {
		if ( ! is_array( $priorities ) ) {
			continue;
		}

		foreach ( $priorities as $priority_boxes ) {
			if ( ! is_array( $priority_boxes ) ) {
				continue;
			}

			foreach ( $priority_boxes as $id => $box ) {
				if ( empty( $box['callback'] ) || ! is_callable( $box['callback'] ) ) {
					continue;
				}

				$meta_boxes[] = array(
					'id'       => (string) $id,
					'title'    => isset( $box['title'] ) ? wp_strip_all_tags( (string) $box['title'] ) : (string) $id,
					'callback' => $box['callback'],
					'args'     => $box['args'] ?? null,
				);
			}
		}
	}

	/**
	 * Filters the legacy dashboard widgets exposed to the new dashboard.
	 *
	 * @param array<int, array{id: string, title: string, callback: callable, args: mixed}> $meta_boxes
	 */
	return apply_filters( 'gutenberg_legacy_dashboard_meta_boxes', $meta_boxes );
}

/**
 * Registers legacy dashboard widgets in `WP_Widget_Type_Registry`.
 */
function gutenberg_register_legacy_dashboard_widget_types() {
	if ( ! class_exists( 'WP_Widget_Type_Registry', false ) ) {
		return;
	}

	$registry      = WP_Widget_Type_Registry::get_instance();
	$render_module = gutenberg_get_legacy_dashboard_render_module();

	foreach ( gutenberg_get_legacy_dashboard_meta_boxes() as $meta_box ) {
		$name = gutenberg_legacy_dashboard_widget_type_name( $meta_box['id'] );

		if ( $registry->is_registered( $name ) ) {
			continue;
		}

		$registry->register(
			$name,
			array(
				'render_module' => $render_module,
				'widget_module' => null,
				'legacy_id'     => $meta_box['id'],
				'title'         => $meta_box['title'],
				'presentation'  => 'framed',
			)
		);
	}
}

/**
 * Appends legacy widget type registration after manifest-driven types load.
 *
 * Runs on `admin_init` (not `init`) because `get_current_screen()` and the
 * dashboard meta box APIs are only available once the admin bootstrap has
 * loaded `wp-admin/includes/screen.php`. Mirrors the legacy-widget block
 * preview handler timing.
 */
function gutenberg_register_legacy_dashboard_widget_types_after_manifest() {
	if ( ! is_admin() && ! ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}

	gutenberg_register_legacy_dashboard_widget_types();
}

add_action( 'admin_init', 'gutenberg_register_legacy_dashboard_widget_types_after_manifest', 20 );
add_action( 'rest_api_init', 'gutenberg_register_legacy_dashboard_widget_types_after_manifest', 20 );

/**
 * Renders a single legacy dashboard widget by id.
 *
 * @param string $widget_id Dashboard widget id.
 */
function gutenberg_render_legacy_dashboard_widget( $widget_id ) {
	gutenberg_ensure_legacy_dashboard_widgets_loaded();

	foreach ( gutenberg_get_legacy_dashboard_meta_boxes() as $meta_box ) {
		if ( $meta_box['id'] !== $widget_id ) {
			continue;
		}

		$box = array(
			'id'       => $meta_box['id'],
			'title'    => $meta_box['title'],
			'callback' => $meta_box['callback'],
			'args'     => $meta_box['args'],
		);

		echo '<div class="postbox" id="' . esc_attr( $meta_box['id'] ) . '">';
		echo '<div class="inside">';
		call_user_func( $meta_box['callback'], '', $box );
		echo '</div></div>';
		return;
	}
}

/**
 * Serves an isolated admin iframe preview for a legacy dashboard widget.
 */
function gutenberg_handle_legacy_dashboard_widget_preview_iframe() {
	if ( empty( $_GET['dashboard-legacy-widget-preview'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return;
	}

	if ( ! current_user_can( 'read' ) ) {
		return;
	}

	$widget_id = sanitize_key( wp_unslash( $_GET['dashboard-legacy-widget-preview'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	define( 'IFRAME_REQUEST', true );

	?>
	<!doctype html>
	<html <?php language_attributes(); ?>>
	<head>
		<meta charset="<?php bloginfo( 'charset' ); ?>" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<?php wp_enqueue_style( 'common' ); ?>
		<?php wp_enqueue_style( 'forms' ); ?>
		<?php wp_enqueue_style( 'dashboard' ); ?>
		<?php wp_admin_css( 'dashboard', true ); ?>
		<?php wp_admin_css(); ?>
		<?php wp_head(); ?>
		<style>
			html, body, #page, #content {
				padding: 0 !important;
				margin: 0 !important;
				background: transparent !important;
			}

			body {
				font-size: 0 !important;
			}

			body *:not(#page):not(#content):not(.postbox):not(.postbox *) {
				display: none !important;
				font-size: 0 !important;
				height: 0 !important;
				left: -9999px !important;
				max-height: 0 !important;
				max-width: 0 !important;
				opacity: 0 !important;
				pointer-events: none !important;
				position: absolute !important;
				top: -9999px !important;
				transform: translate(-9999px, -9999px) !important;
				visibility: hidden !important;
				z-index: -999 !important;
			}

			.postbox {
				border: none !important;
				box-shadow: none !important;
				font-size: 13px;
				margin: 0 !important;
			}

			.postbox .postbox-header,
			.postbox .handlediv,
			.postbox .handle-order-higher,
			.postbox .handle-order-lower {
				display: none !important;
			}
		</style>
	</head>
	<body <?php body_class(); ?>>
		<div id="page" class="site">
			<div id="content" class="site-content">
				<?php gutenberg_render_legacy_dashboard_widget( $widget_id ); ?>
			</div>
		</div>
		<?php wp_footer(); ?>
	</body>
	</html>
	<?php

	exit;
}

add_action( 'admin_init', 'gutenberg_handle_legacy_dashboard_widget_preview_iframe', 20 );
