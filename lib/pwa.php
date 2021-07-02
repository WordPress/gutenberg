<?php
/**
 * Progressive Web App
 *
 * @package gutenberg
 */

add_filter(
	'admin_head',
	function() {
		$script      = file_get_contents( __DIR__ . '/pwa-load.js' );
		$script_vars = wp_json_encode(
			array(
				// Must be at the admin root so the scope is correct. Move to the
				// wp-admin folder when merging with core.
				'serviceWorkerUrl' => admin_url( '?service-worker' ),
				'logo'             => file_get_contents( ABSPATH . 'wp-admin/images/wordpress-logo-white.svg' ),
				'siteTitle'        => get_bloginfo( 'name' ),
				'adminUrl'         => admin_url(),
			)
		);

		echo "<script>( function( scriptVars ) { $script } )( $script_vars );</script>";
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
