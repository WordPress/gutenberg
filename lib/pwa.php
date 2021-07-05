<?php
/**
 * Progressive Web App
 *
 * @package gutenberg
 */

add_filter(
	'admin_head',
	function() {
		$l10n = array(
			'logo'      => file_get_contents( ABSPATH . 'wp-admin/images/wordpress-logo-white.svg' ),
			'siteTitle' => get_bloginfo( 'name' ),
			'adminUrl'  => admin_url(),
		);
		wp_enqueue_script( 'wp-admin-manifest' );
		wp_localize_script( 'wp-admin-manifest', 'wpAdminManifestL10n', $l10n );
	}
);

add_filter(
	'load-index.php',
	function() {
		if ( ! isset( $_GET['service-worker'] ) ) {
			return;
		}

		header( 'Content-Type: text/javascript' );
		// Must be at the admin root so the scope is correct. Move to the
		// wp-admin folder when merging with core.
		echo file_get_contents( __DIR__ . '/service-worker.js' );
		exit;
	}
);
