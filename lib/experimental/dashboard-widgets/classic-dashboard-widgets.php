<?php
/**
 * Classic Dashboard Widgets: bridges `wp_add_dashboard_widget()` registrations
 * into the experimental widget type registry and iframe preview endpoint.
 *
 * @package gutenberg
 */

/**
 * Returns the script-module handle shared by all classic dashboard widget types.
 *
 * @return string
 */
function gutenberg_get_classic_dashboard_render_module() {
	return 'wp/widgets/classic-dashboard/render';
}

/**
 * Converts a classic dashboard widget id into a namespaced widget type name.
 *
 * @param string $widget_id Dashboard widget id passed to `wp_add_dashboard_widget()`.
 * @return string Widget type name in `wp-classic/{slug}` form.
 */
function gutenberg_classic_dashboard_widget_type_name( $widget_id ) {
	$slug = strtolower( (string) $widget_id );
	$slug = str_replace( '_', '-', $slug );
	$slug = preg_replace( '/[^a-z0-9-]+/', '-', $slug );
	$slug = trim( $slug, '-' );

	if ( '' === $slug ) {
		$slug = 'widget';
	}

	return 'wp-classic/' . $slug;
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
 * Registers core dashboard widgets for discovery without browser/PHP nag checks.
 *
 * Mirrors the widget-registration portion of `wp_dashboard_setup()` in core,
 * omitting `wp_check_browser_version()` and `wp_check_php_version()` which are
 * not available outside a full admin bootstrap.
 */
function gutenberg_register_core_dashboard_widgets_for_discovery() {
	if ( is_network_admin() ) {
		wp_add_dashboard_widget( 'network_dashboard_right_now', __( 'Right Now' ), 'wp_network_dashboard_right_now' );
		return;
	}

	if ( is_user_admin() ) {
		return;
	}

	// Site Health.
	if ( current_user_can( 'view_site_health_checks' ) ) {
		if ( ! class_exists( 'WP_Site_Health' ) ) {
			require_once ABSPATH . 'wp-admin/includes/class-wp-site-health.php';
		}

		WP_Site_Health::get_instance();

		wp_add_dashboard_widget( 'dashboard_site_health', __( 'Site Health Status' ), 'wp_dashboard_site_health' );
	}

	// At a Glance.
	if ( is_blog_admin() && current_user_can( 'edit_posts' ) ) {
		wp_add_dashboard_widget( 'dashboard_right_now', __( 'At a Glance' ), 'wp_dashboard_right_now' );
	}

	// Activity.
	if ( is_blog_admin() ) {
		wp_add_dashboard_widget( 'dashboard_activity', __( 'Activity' ), 'wp_dashboard_site_activity' );
	}

	// Welcome panel (not a meta box on the classic dashboard, but exposed as one here).
	if ( is_blog_admin() && function_exists( 'wp_welcome_panel' ) ) {
		wp_add_dashboard_widget( 'dashboard_welcome', __( 'Welcome' ), 'wp_welcome_panel' );
	}

	// Quick Draft.
	$post_type = get_post_type_object( 'post' );

	if ( is_blog_admin() && $post_type && current_user_can( $post_type->cap->create_posts ) ) {
		$quick_draft_title = sprintf(
			'<span class="hide-if-no-js">%1$s</span> <span class="hide-if-js">%2$s</span>',
			__( 'Quick Draft' ),
			__( 'Your Recent Drafts' )
		);
		wp_add_dashboard_widget( 'dashboard_quick_press', $quick_draft_title, 'wp_dashboard_quick_press' );
	}

	// WordPress Events and News.
	wp_add_dashboard_widget( 'dashboard_primary', __( 'WordPress Events and News' ), 'wp_dashboard_events_news' );
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

	gutenberg_register_core_dashboard_widgets_for_discovery();

	if ( is_network_admin() ) {
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
function gutenberg_ensure_classic_dashboard_widgets_loaded() {
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
function gutenberg_get_classic_dashboard_meta_boxes() {
	gutenberg_ensure_classic_dashboard_widgets_loaded();

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
	 * Filters the classic dashboard widgets exposed to the new dashboard.
	 *
	 * @param array<int, array{id: string, title: string, callback: callable, args: mixed}> $meta_boxes
	 */
	return apply_filters( 'gutenberg_classic_dashboard_meta_boxes', $meta_boxes );
}

/**
 * Registers classic dashboard widgets in `WP_Widget_Type_Registry`.
 */
function gutenberg_register_classic_dashboard_widget_types() {
	if ( ! class_exists( 'WP_Widget_Type_Registry', false ) ) {
		return;
	}

	$registry       = WP_Widget_Type_Registry::get_instance();
	$render_module  = gutenberg_get_classic_dashboard_render_module();
	$metadata_module = 'wp/widgets/classic-dashboard/widget';

	foreach ( gutenberg_get_classic_dashboard_meta_boxes() as $meta_box ) {
		$name = gutenberg_classic_dashboard_widget_type_name( $meta_box['id'] );

		if ( $registry->is_registered( $name ) ) {
			continue;
		}

		$registry->register(
			$name,
			array(
				'render_module' => $render_module,
				'widget_module' => $metadata_module,
				'classic_id'     => $meta_box['id'],
				'title'         => $meta_box['title'],
				'presentation'  => 'framed',
			)
		);
	}
}

/**
 * Whether classic dashboard widgets should be discovered in this request.
 *
 * Avoids running discovery on every wp-admin screen (which would fire
 * `wp_dashboard_setup` before `index.php` and double-register widgets).
 *
 * @return bool
 */
function gutenberg_should_discover_classic_dashboard_widgets() {
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return true;
	}

	if ( ! is_admin() ) {
		return false;
	}

	if ( ! empty( $_GET['dashboard-classic-widget-preview'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return true;
	}

	global $pagenow;

	return isset( $pagenow ) && 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'dashboard-wp-admin' === $_GET['page']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
}

/**
 * Appends classic widget type registration after manifest-driven types load.
 *
 * Classic types requested over REST are also registered lazily from
 * `WP_REST_Widget_Modules_Controller::get_items()`.
 */
function gutenberg_register_classic_dashboard_widget_types_after_manifest() {
	if ( ! gutenberg_should_discover_classic_dashboard_widgets() ) {
		return;
	}

	gutenberg_register_classic_dashboard_widget_types();
}

add_action( 'admin_init', 'gutenberg_register_classic_dashboard_widget_types_after_manifest', 20 );

/**
 * Renders a single classic dashboard widget by id.
 *
 * @param string $widget_id Dashboard widget id.
 */
function gutenberg_render_classic_dashboard_widget( $widget_id ) {
	gutenberg_ensure_classic_dashboard_widgets_loaded();

	foreach ( gutenberg_get_classic_dashboard_meta_boxes() as $meta_box ) {
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
 * Sets admin globals so classic dashboard widget callbacks enqueue assets for index.php.
 */
function gutenberg_prepare_classic_dashboard_widget_preview_admin_context() {
	global $pagenow, $hook_suffix;

	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$pagenow = 'index.php';

	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$hook_suffix = 'index.php';

	gutenberg_ensure_classic_dashboard_widgets_loaded();
}

/**
 * Enqueues baseline wp-admin styles used by the classic dashboard (common.css, dashboard.css, etc.).
 *
 * Mirrors admin-header.php on index.php, where `colors` depends on the `wp-admin` bundle.
 */
function gutenberg_enqueue_classic_dashboard_widget_preview_base_styles() {
	wp_enqueue_style( 'colors' );
	wp_enqueue_style( 'common' );
	wp_enqueue_style( 'forms' );
	wp_enqueue_style( 'dashboard' );

	if ( wp_style_is( 'list-tables', 'registered' ) ) {
		wp_enqueue_style( 'list-tables' );
	}
}

/**
 * Enqueues admin scripts and styles for the classic dashboard widget preview iframe.
 *
 * Call after rendering the widget so callbacks can register assets first.
 */
function gutenberg_enqueue_classic_dashboard_widget_preview_assets() {
	global $hook_suffix;

	if ( empty( $hook_suffix ) ) {
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$hook_suffix = 'index.php';
	}

	gutenberg_enqueue_classic_dashboard_widget_preview_base_styles();
	wp_enqueue_script( 'jquery' );

	if ( wp_script_is( 'dashboard', 'registered' ) ) {
		wp_enqueue_script( 'dashboard' );
	}

	/**
	 * Fires when enqueuing assets for a classic dashboard widget preview iframe.
	 *
	 * @param string $hook_suffix Admin screen suffix (`index.php`).
	 */
	do_action( 'gutenberg_classic_dashboard_widget_preview_enqueue', $hook_suffix );

	do_action( 'admin_enqueue_scripts', $hook_suffix ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
}

/**
 * Prints enqueued admin styles and head scripts for the preview iframe.
 */
function gutenberg_print_classic_dashboard_widget_preview_head_assets() {
	global $hook_suffix;

	if ( empty( $hook_suffix ) ) {
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$hook_suffix = 'index.php';
	}

	// Ensure core admin stylesheets are output even if nothing hooked admin_enqueue_scripts.
	foreach ( array( 'colors', 'common', 'forms', 'dashboard' ) as $style_handle ) {
		if ( wp_style_is( $style_handle, 'registered' ) ) {
			wp_enqueue_style( $style_handle );
		} elseif ( function_exists( 'wp_admin_css' ) ) {
			wp_admin_css( $style_handle, true );
		}
	}

	do_action( "admin_print_styles-{$hook_suffix}" ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores, WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
	do_action( 'admin_print_styles' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound

	do_action( "admin_print_scripts-{$hook_suffix}" ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores, WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
	do_action( 'admin_print_scripts' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound

	do_action( "admin_head-{$hook_suffix}" ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores, WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
	do_action( 'admin_head' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
}

/**
 * Prints enqueued admin footer scripts for the preview iframe.
 */
function gutenberg_print_classic_dashboard_widget_preview_footer_assets() {
	global $hook_suffix;

	if ( empty( $hook_suffix ) ) {
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$hook_suffix = 'index.php';
	}

	do_action( 'admin_footer', '' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound

	do_action( "admin_print_footer_scripts-{$hook_suffix}" ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores, WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
	do_action( 'admin_print_footer_scripts' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
}

/**
 * Returns inline CSS that isolates the widget postbox inside the preview iframe.
 *
 * @return string
 */
function gutenberg_get_classic_dashboard_widget_preview_isolation_styles() {
	return '
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
		';
}

/**
 * Serves an isolated admin iframe preview for a classic dashboard widget.
 */
function gutenberg_handle_classic_dashboard_widget_preview_iframe() {
	if ( empty( $_GET['dashboard-classic-widget-preview'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return;
	}

	if ( ! current_user_can( 'read' ) ) {
		return;
	}

	$widget_id = sanitize_key( wp_unslash( $_GET['dashboard-classic-widget-preview'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	define( 'IFRAME_REQUEST', true );

	gutenberg_prepare_classic_dashboard_widget_preview_admin_context();

	// Render the widget before printing assets so callbacks can enqueue styles/scripts.
	ob_start();
	gutenberg_render_classic_dashboard_widget( $widget_id );
	$widget_content = ob_get_clean();

	gutenberg_enqueue_classic_dashboard_widget_preview_assets();

	?>
	<!doctype html>
	<html <?php language_attributes(); ?>>
	<head>
		<meta charset="<?php bloginfo( 'charset' ); ?>" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<?php gutenberg_print_classic_dashboard_widget_preview_head_assets(); ?>
		<style><?php echo gutenberg_get_classic_dashboard_widget_preview_isolation_styles(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></style>
	</head>
	<body <?php body_class( 'wp-admin wp-core-ui index-php dashboard' ); ?>>
		<div id="page" class="site">
			<div id="content" class="site-content">
				<?php echo $widget_content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</div>
		</div>
		<?php gutenberg_print_classic_dashboard_widget_preview_footer_assets(); ?>
	</body>
	</html>
	<?php

	exit;
}

add_action( 'admin_init', 'gutenberg_handle_classic_dashboard_widget_preview_iframe', 20 );
