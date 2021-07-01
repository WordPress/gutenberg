<?php
/**
 * Progressive Web App
 *
 * @package gutenberg
 */

add_filter(
	'admin_head',
	function() {
		// Move to the wp-admin folder when merging with core.
		$manifest_url = admin_url( '?manifest' );
		// Must be at the admin root so the scope is correct. Move to the
		// wp-admin folder when merging with core.
		$service_worker_url = admin_url( '?service-worker' );
		echo '<link rel="manifest" crossorigin="use-credentials" href="' . $manifest_url . '">';
		echo '<script>
			if( "serviceWorker" in window.navigator ) {
				window.addEventListener( "load", function() {
					window.navigator.serviceWorker.register( "' . $service_worker_url . '" );
				} );
			}
		</script>';
	}
);

add_filter(
	'load-index.php',
	function() {
		if ( ! isset( $_GET['manifest'] ) ) {
			return;
		}

		require_once __DIR__ . '/manifest.php';
		exit;
	}
);

add_filter(
	'load-index.php',
	function() {
		if ( ! isset( $_GET['service-worker'] ) ) {
			return;
		}

		header( 'Content-Type: text/javascript' );
		echo file_get_contents( __DIR__ . '/service-worker.js' );
		exit;
	}
);
