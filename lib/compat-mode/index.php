<?php
/**
 * Compat mode for blocks that need isolation from the main editor iframe.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Intercepts the compat mode editor request and renders the page.
 */
function gutenberg_handle_compat_mode_request() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Nonce verified below.
	if ( ! isset( $_GET['gutenberg-compat-mode'] ) ) {
		return;
	}

	// Verify user has permission.
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( esc_html__( 'You do not have permission to access this page.', 'gutenberg' ) );
	}

	// Verify nonce.
	if ( ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'gutenberg_compat_mode' ) ) {
		wp_die( esc_html__( 'Security check failed.', 'gutenberg' ) );
	}

	// Get the block name.
	$block_name = isset( $_GET['block_name'] ) ? sanitize_text_field( wp_unslash( $_GET['block_name'] ) ) : '';
	if ( empty( $block_name ) ) {
		wp_die( esc_html__( 'Block name is required.', 'gutenberg' ) );
	}

	// Verify the block type exists.
	$block_registry = WP_Block_Type_Registry::get_instance();
	$block_type     = $block_registry->get_registered( $block_name );
	if ( ! $block_type ) {
		wp_die( esc_html__( 'Block type not found.', 'gutenberg' ) );
	}

	// Set up required globals for admin-header.php.
	global $title, $hook_suffix, $current_screen, $pagenow;
	$title       = __( 'Block Compat Mode Editor', 'gutenberg' );
	$hook_suffix = 'gutenberg-compat-mode';
	$pagenow     = 'admin.php';

	// Set up screen.
	set_current_screen( 'gutenberg-compat-mode' );
	$current_screen = get_current_screen();
	if ( $current_screen ) {
		$current_screen->is_block_editor( true );
	}

	// Disable emoji - same as core block editor.
	remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );

	// Enqueue assets.
	gutenberg_enqueue_compat_mode_assets();

	// Get editor settings.
	$editor_settings = get_block_editor_settings(
		array(),
		new WP_Block_Editor_Context( array( 'name' => 'core/compat-mode' ) )
	);

	// Mark that we're inside the compat mode editor to prevent recursive iframe rendering.
	$editor_settings['isCompatModeEditor'] = true;

	// Pass config and editor script via inline script.
	$config_script = sprintf(
		'window.compatModeConfig = %s;',
		wp_json_encode(
			array(
				'blockName'      => $block_name,
				'editorSettings' => $editor_settings,
			)
		)
	);
	wp_add_inline_script( 'wp-dom-ready', $config_script, 'before' );

	// Load the editor script content and add it inline.
	// We use inline script because the lib/ directory may not be web-accessible.
	$editor_script = file_get_contents( __DIR__ . '/editor.js' );
	wp_add_inline_script( 'wp-dom-ready', $editor_script, 'after' );

	// Include admin header.
	require_once ABSPATH . 'wp-admin/admin-header.php';

	// Render the editor container.
	?>
	<style>
		html, body, #wpwrap, #wpcontent, #wpbody, #wpbody-content {
			height: 100%;
			margin: 0;
			padding: 0;
			overflow: hidden;
		}
		#wpadminbar, #adminmenumain, #wpfooter, .notice, .update-nag {
			display: none !important;
		}
		#wpcontent {
			margin-left: 0 !important;
		}
		#wpbody-content {
			padding-bottom: 0;
			float: none;
		}
		#compat-mode-editor {
			width: 100%;
			height: 100%;
		}
		.compat-mode-block-wrapper {
			width: 100%;
		}
	</style>

	<div id="compat-mode-editor"></div>
	<?php

	// Don't include admin footer - exit here.
	exit;
}
// Use default priority so admin colors and other globals are set up first.
add_action( 'admin_init', 'gutenberg_handle_compat_mode_request' );

/**
 * Enqueues assets for the compat mode editor.
 */
function gutenberg_enqueue_compat_mode_assets() {
	wp_enqueue_script( 'wp-block-editor' );
	wp_enqueue_script( 'wp-blocks' );
	wp_enqueue_script( 'wp-components' );
	wp_enqueue_script( 'wp-data' );
	wp_enqueue_script( 'wp-element' );
	wp_enqueue_script( 'wp-i18n' );
	wp_enqueue_script( 'wp-hooks' );
	wp_enqueue_script( 'wp-dom-ready' );
	wp_enqueue_script( 'wp-block-library' );

	wp_enqueue_style( 'wp-block-editor' );
	wp_enqueue_style( 'wp-components' );
	wp_enqueue_style( 'wp-edit-blocks' );
	wp_enqueue_style( 'wp-block-library' );

	// Enqueue all registered block editor scripts.
	$block_registry = WP_Block_Type_Registry::get_instance();
	foreach ( $block_registry->get_all_registered() as $block_type ) {
		if ( ! empty( $block_type->editor_script_handles ) ) {
			foreach ( $block_type->editor_script_handles as $handle ) {
				wp_enqueue_script( $handle );
			}
		}
		if ( ! empty( $block_type->editor_script ) ) {
			wp_enqueue_script( $block_type->editor_script );
		}
		if ( ! empty( $block_type->editor_style_handles ) ) {
			foreach ( $block_type->editor_style_handles as $handle ) {
				wp_enqueue_style( $handle );
			}
		}
		if ( ! empty( $block_type->editor_style ) ) {
			wp_enqueue_style( $block_type->editor_style );
		}
	}

	do_action( 'enqueue_block_editor_assets' );

	// Bootstrap server-side block definitions.
	require_once ABSPATH . 'wp-admin/includes/post.php';
	$block_definitions = get_block_editor_server_block_settings();
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( $block_definitions, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ) . ');'
	);
}

/**
 * Adds the compat mode editor URL to block editor settings.
 *
 * @param array $settings The block editor settings.
 * @return array Modified settings.
 */
function gutenberg_add_compat_mode_settings( $settings ) {
	$settings['compatModeEditorUrl'] = admin_url( 'admin.php?gutenberg-compat-mode=1' );
	$settings['compatModeNonce']     = wp_create_nonce( 'gutenberg_compat_mode' );
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_compat_mode_settings' );
