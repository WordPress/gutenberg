<?php
/**
 * Progressive Web App
 *
 * @package gutenberg
 */

add_filter(
	'admin_head',
	function() {
		$icon_sizes = array( 32, 180, 192, 270, 512 );

		// Ideally we have the WordPress logo as the default app logo in the sizes
		// below.
		$icons = array();

		if ( has_site_icon() ) {
			$type = wp_check_filetype( get_site_icon_url() );

			foreach ( $icon_sizes as $size ) {
				$icons[] = array(
					'src'   => get_site_icon_url( $size ),
					'sizes' => $size . 'x' . $size,
					'type'  => $type['type'],
				);
			}
		}

		$manifest = wp_json_encode(
			array(
				'name'        => get_bloginfo( 'name' ),
				'icons'       => $icons,
				'display'     => 'standalone',
				'orientation' => 'portrait',
				'start_url'   => admin_url(),
				// Open front-end, login page, and any external URLs in a browser modal.
				'scope'       => admin_url(),
			)
		);

		// Must be at the admin root so the scope is correct. Move to the
		// wp-admin folder when merging with core.
		$service_worker_url = admin_url( '?service-worker' );

		echo '<link rel="manifest" href=\'data:application/manifest+json,' . $manifest . '\'>';
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
		if ( ! isset( $_GET['service-worker'] ) ) {
			return;
		}

		header( 'Content-Type: text/javascript' );
		echo file_get_contents( __DIR__ . '/service-worker.js' );
		exit;
	}
);
