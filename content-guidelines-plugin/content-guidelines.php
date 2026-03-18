<?php
/**
 * Plugin Name: Content Guidelines
 * Description: Define content standards that guide your team, inform plugins, and help AI tools generate content that matches your site's voice and requirements.
 * Version: 1.0.0
 * Requires at least: 6.7
 * Requires PHP: 7.4
 * Author: Automattic
 * License: GPL-2.0-or-later
 * Text Domain: content-guidelines
 *
 * @package content-guidelines
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Admin notice when Gutenberg is not active.
 */
function cg_gutenberg_missing_notice() {
	?>
	<div class="notice notice-error">
		<p><?php esc_html_e( 'Content Guidelines requires the Gutenberg plugin to be installed and active.', 'content-guidelines' ); ?></p>
	</div>
	<?php
}

/**
 * Bootstrap the plugin after all plugins have loaded so Gutenberg is available.
 *
 * Our plugin file loads before Gutenberg alphabetically ("C" < "G"), so we
 * defer the dependency check and hook registration to plugins_loaded.
 */
function cg_bootstrap() {
	if ( ! function_exists( 'gutenberg_is_experiment_enabled' ) ) {
		add_action( 'admin_notices', 'cg_gutenberg_missing_notice' );
		return;
	}

	// Load class files.
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-post-type.php';
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-rest-controller.php';
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-revisions-controller.php';

	// Register post type and meta.
	add_action( 'init', array( 'CG_Post_Type', 'register' ) );
	add_action( 'rest_api_init', array( 'CG_Post_Type', 'register_post_meta' ) );

	// Register admin menu.
	add_action( 'admin_menu', 'cg_register_settings_submenu' );

	// Enqueue scripts.
	add_action( 'admin_enqueue_scripts', 'cg_enqueue_block_registry_scripts', 5 );
	add_action( 'admin_enqueue_scripts', 'cg_enqueue_admin_scripts', 10 );

	// Explorations admin bar.
	add_action( 'admin_bar_menu', 'cg_admin_bar_explorations', 100 );
}
add_action( 'plugins_loaded', 'cg_bootstrap' );

/**
 * Registers the Content Guidelines submenu item under Settings.
 */
function cg_register_settings_submenu() {
	add_submenu_page(
		'options-general.php',
		__( 'Guidelines', 'content-guidelines' ),
		__( 'Guidelines', 'content-guidelines' ),
		'manage_options',
		'content-guidelines-wp-admin',
		'cg_render_admin_page'
	);
}

/**
 * Renders the Content Guidelines admin page.
 */
function cg_render_admin_page() {
	?>
	<div class="wrap">
		<div id="content-guidelines-root"></div>
	</div>
	<?php
}

/**
 * Enqueues wp-block-library on the Content Guidelines admin page.
 *
 * @param string $hook_suffix The current admin page hook suffix.
 */
function cg_enqueue_block_registry_scripts( $hook_suffix ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( 'settings_page_content-guidelines-wp-admin' !== $hook_suffix ) {
		return;
	}

	wp_enqueue_script( 'wp-block-library' );
}

/**
 * Enqueues the built JS and CSS for the Content Guidelines admin page.
 *
 * @param string $hook_suffix The current admin page hook suffix.
 */
function cg_enqueue_admin_scripts( $hook_suffix ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( 'settings_page_content-guidelines-wp-admin' !== $hook_suffix ) {
		return;
	}

	$asset_file = plugin_dir_path( __FILE__ ) . 'build/main.asset.php';
	if ( ! file_exists( $asset_file ) ) {
		return;
	}

	$asset = require $asset_file;

	wp_enqueue_script(
		'content-guidelines',
		plugins_url( 'build/main.js', __FILE__ ),
		$asset['dependencies'],
		$asset['version'],
		true
	);

	wp_enqueue_style(
		'content-guidelines',
		plugins_url( 'build/style-main.css', __FILE__ ),
		array( 'wp-components' ),
		$asset['version']
	);

	wp_enqueue_style(
		'content-guidelines-editor',
		plugins_url( 'build/main.css', __FILE__ ),
		array(),
		$asset['version']
	);
}

/**
 * Adds an "Explorations" dropdown to the admin bar on the Content Guidelines page.
 *
 * @param WP_Admin_Bar $wp_admin_bar The admin bar instance.
 */
function cg_admin_bar_explorations( $wp_admin_bar ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( ! function_exists( 'get_current_screen' ) ) {
		return;
	}

	$screen = get_current_screen();
	if ( ! $screen || 'settings_page_content-guidelines-wp-admin' !== $screen->id ) {
		return;
	}

	$explorations = array(
		'A' => 'Option A (Current)',
		'B' => 'Option B (Suggest All)',
		'C' => 'Option C (Proactive)',
	);

	$wp_admin_bar->add_node(
		array(
			'id'    => 'content-guidelines-explorations',
			'title' => 'Explorations: <span id="cg-exploration-current">Current</span>',
			'href'  => '#',
		)
	);

	foreach ( $explorations as $key => $label ) {
		$wp_admin_bar->add_node(
			array(
				'parent' => 'content-guidelines-explorations',
				'id'     => 'cg-exploration-' . strtolower( $key ),
				'title'  => $label,
				'href'   => '#',
				'meta'   => array(
					'class' => 'cg-exploration-link',
				),
			)
		);
	}

	// Inline JS to handle clicks, localStorage, and custom event dispatch.
	add_action(
		'admin_footer',
		function () use ( $explorations ) {
			?>
			<script>
			(function() {
				var STORAGE_KEY = 'content-guidelines-exploration';
				var currentEl = document.getElementById('cg-exploration-current');
				var keys = <?php echo wp_json_encode( array_keys( $explorations ) ); ?>;

				function updateLabel() {
					var val = localStorage.getItem(STORAGE_KEY) || 'A';
					if (currentEl) {
						currentEl.textContent = val;
					}
				}

				keys.forEach(function(key) {
					var el = document.getElementById('wp-admin-bar-cg-exploration-' + key.toLowerCase());
					if (el) {
						el.addEventListener('click', function(e) {
							e.preventDefault();
							localStorage.setItem(STORAGE_KEY, key);
							updateLabel();
							window.dispatchEvent(new CustomEvent('exploration-changed'));
						});
					}
				});

				updateLabel();
			})();
			</script>
			<?php
		}
	);
}
