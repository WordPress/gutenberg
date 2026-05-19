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
 * Loads the minimum wp-admin includes needed for dashboard widget discovery.
 *
 * REST requests and early hooks do not bootstrap wp-admin by default, so
 * `WP_Screen` and `add_meta_box()` are unavailable until these files load.
 */
function gutenberg_load_dashboard_admin_dependencies() {
	if ( ! class_exists( 'WP_Screen' ) ) {
		require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
	}

	if ( ! function_exists( 'get_current_screen' ) ) {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
	}

	if ( ! function_exists( 'add_meta_box' ) ) {
		require_once ABSPATH . 'wp-admin/includes/template.php';
	}
}

/**
 * Registers dashboard meta boxes for discovery without running `wp_dashboard_setup()`.
 *
 * The full setup routine pulls in browser/PHP nag checks and other admin-only
 * dependencies that are not loaded during REST requests. This mirrors the
 * widget-registration portion of core only.
 */
function gutenberg_register_dashboard_meta_boxes_for_discovery() {
	if ( did_action( 'wp_dashboard_setup' ) ) {
		return;
	}

	global $wp_dashboard_control_callbacks, $wp_registered_widgets, $wp_registered_widget_controls;

	$wp_dashboard_control_callbacks = array();
	$dashboard_widgets              = array();

	if ( is_network_admin() ) {
		wp_add_dashboard_widget( 'network_dashboard_right_now', __( 'Right Now' ), 'wp_network_dashboard_right_now' );

		/** This action is documented in wp-admin/includes/dashboard.php */
		do_action( 'wp_network_dashboard_setup' );

		/** This filter is documented in wp-admin/includes/dashboard.php */
		$dashboard_widgets = apply_filters( 'wp_network_dashboard_widgets', array() );
	} elseif ( is_user_admin() ) {
		/** This action is documented in wp-admin/includes/dashboard.php */
		do_action( 'wp_user_dashboard_setup' );

		/** This filter is documented in wp-admin/includes/dashboard.php */
		$dashboard_widgets = apply_filters( 'wp_user_dashboard_widgets', array() );
	} else {
		$post_type = get_post_type_object( 'post' );

		if ( $post_type && current_user_can( $post_type->cap->create_posts ) ) {
			$quick_draft_title = sprintf(
				'<span class="hide-if-no-js">%1$s</span> <span class="hide-if-js">%2$s</span>',
				__( 'Quick Draft' ),
				__( 'Your Recent Drafts' )
			);
			wp_add_dashboard_widget( 'dashboard_quick_press', $quick_draft_title, 'wp_dashboard_quick_press' );
		}

		wp_add_dashboard_widget( 'dashboard_primary', __( 'WordPress Events and News' ), 'wp_dashboard_events_news' );

		/** This action is documented in wp-admin/includes/dashboard.php */
		do_action( 'wp_dashboard_setup' );

		/** This filter is documented in wp-admin/includes/dashboard.php */
		$dashboard_widgets = apply_filters( 'wp_dashboard_widgets', array() );
	}

	if (
		! empty( $dashboard_widgets ) &&
		isset( $wp_registered_widgets, $wp_registered_widget_controls )
	) {
		foreach ( $dashboard_widgets as $widget_id ) {
			if ( ! isset( $wp_registered_widgets[ $widget_id ]['callback'] ) ) {
				continue;
			}

			$name = empty( $wp_registered_widgets[ $widget_id ]['all_link'] )
				? $wp_registered_widgets[ $widget_id ]['name']
				: $wp_registered_widgets[ $widget_id ]['name'] . " <a href='{$wp_registered_widgets[$widget_id]['all_link']}' class='edit-box open-box'>" . __( 'View all' ) . '</a>';

			$control_callback = $wp_registered_widget_controls[ $widget_id ]['callback'] ?? null;

			wp_add_dashboard_widget(
				$widget_id,
				$name,
				$wp_registered_widgets[ $widget_id ]['callback'],
				$control_callback
			);
		}
	}
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

	$should_load = is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST );

	if ( ! $should_load ) {
		return;
	}

	$loaded = true;

	gutenberg_load_dashboard_admin_dependencies();

	require_once ABSPATH . 'wp-admin/includes/dashboard.php';

	$screen = get_current_screen();
	if ( ! $screen || 'dashboard' !== $screen->id ) {
		set_current_screen( 'dashboard' );
	}

	// Plugins such as Jetpack defer `wp_dashboard_setup` to `load-index.php`.
	if ( ! did_action( 'load-index.php' ) ) {
		/** This action is documented in wp-admin/admin.php */
		do_action( 'load-index.php' );
	}

	gutenberg_register_dashboard_meta_boxes_for_discovery();
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

	$registry       = WP_Widget_Type_Registry::get_instance();
	$render_module  = gutenberg_get_legacy_dashboard_render_module();
	$metadata_module = 'wp/widgets/legacy-dashboard/widget';

	foreach ( gutenberg_get_legacy_dashboard_meta_boxes() as $meta_box ) {
		$name = gutenberg_legacy_dashboard_widget_type_name( $meta_box['id'] );

		if ( $registry->is_registered( $name ) ) {
			continue;
		}

		$registry->register(
			$name,
			array(
				'render_module' => $render_module,
				'widget_module' => $metadata_module,
				'legacy_id'     => $meta_box['id'],
				'title'         => $meta_box['title'],
				'presentation'  => 'framed',
			)
		);
	}
}

/**
 * Whether legacy dashboard widgets should be discovered in this request.
 *
 * Avoids running discovery on every wp-admin screen (which would fire
 * `wp_dashboard_setup` before `index.php` and double-register widgets).
 *
 * @return bool
 */
function gutenberg_should_discover_legacy_dashboard_widgets() {
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return true;
	}

	if ( ! is_admin() ) {
		return false;
	}

	if ( ! empty( $_GET['dashboard-legacy-widget-preview'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return true;
	}

	global $pagenow;

	return isset( $pagenow ) && 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'dashboard-wp-admin' === $_GET['page']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
}

/**
 * Appends legacy widget type registration after manifest-driven types load.
 *
 * Legacy types requested over REST are also registered lazily from
 * `WP_REST_Widget_Modules_Controller::get_items()`.
 */
function gutenberg_register_legacy_dashboard_widget_types_after_manifest() {
	if ( ! gutenberg_should_discover_legacy_dashboard_widgets() ) {
		return;
	}

	gutenberg_register_legacy_dashboard_widget_types();
}

add_action( 'admin_init', 'gutenberg_register_legacy_dashboard_widget_types_after_manifest', 20 );

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
