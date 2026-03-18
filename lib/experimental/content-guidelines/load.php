<?php
/**
 * Bootstraps the Content Guidelines page in wp-admin under Settings.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_register_content_guidelines_settings_submenu', 10 );
add_action( 'admin_enqueue_scripts', 'gutenberg_content_guidelines_enqueue_block_registry_scripts', 5 );
add_action( 'admin_bar_menu', 'gutenberg_content_guidelines_admin_bar_explorations', 100 );

/**
 * Registers the Content Guidelines submenu item under Settings.
 * Uses the same layout/style as the Font Library admin page (wp-admin integrated).
 */
function gutenberg_register_content_guidelines_settings_submenu() {
	add_submenu_page(
		'options-general.php',
		__( 'Guidelines', 'gutenberg' ),
		__( 'Guidelines', 'gutenberg' ),
		'manage_options',
		'content-guidelines-wp-admin',
		'gutenberg_content_guidelines_wp_admin_render_page'
	);
}

/**
 * Enqueues wp-block-library on the Content Guidelines admin page so
 * registerCoreBlocks() is available when the app bootstraps the block
 * registry (Core blocks only) on the client.
 *
 * Priority 5 ensures this runs before the main asset enqueue (priority 10).
 */
function gutenberg_content_guidelines_enqueue_block_registry_scripts( $hook_suffix ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( 'settings_page_content-guidelines-wp-admin' !== $hook_suffix ) {
		return;
	}

	wp_enqueue_script( 'wp-block-library' );
}

/**
 * Adds an "Explorations" dropdown to the admin bar on the Content Guidelines page.
 * This allows toggling between different UI variations without changing code.
 *
 * @param WP_Admin_Bar $wp_admin_bar The admin bar instance.
 */
function gutenberg_content_guidelines_admin_bar_explorations( $wp_admin_bar ) {
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

				// Event delegation on admin bar exploration links.
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
