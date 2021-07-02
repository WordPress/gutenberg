<?php
/**
 * Progressive Web App
 *
 * @package gutenberg
 */

add_filter(
	'admin_head',
	function() {
		$icon_sizes = array( 180, 192, 512 );

		$icons = array(
			array(
				'src'   => 'https://s1.wp.com/i/favicons/apple-touch-icon-180x180.png',
				'sizes' => '180x180',
				'type'  => 'image/png',
			),
			// Android/Chrome.
			array(
				'src'   => 'https://wordpress.com/calypso/images/manifest/icon-192x192.png',
				'sizes' => '192x192',
				'type'  => 'image/png',
			),
			array(
				'src'   => 'https://wordpress.com/calypso/images/manifest/icon-512x512.png',
				'sizes' => '512x512',
				'type'  => 'image/png',
			),
		);

		if ( false ) {
			$type = wp_check_filetype( get_site_icon_url() );

			foreach ( $icon_sizes as $size ) {
				$icons[] = array(
					'src'   => get_site_icon_url( $size ),
					'sizes' => $size . 'x' . $size,
					'type'  => $type['type'],
				);
			}
		}

		$manifest = array(
			'name'        => get_bloginfo( 'name' ),
			// 'icons'       => $icons,
			'display'     => 'standalone',
			'orientation' => 'portrait',
			'start_url'   => admin_url(),
			// Open front-end, login page, and any external URLs in a browser modal.
			'scope'       => admin_url(),
		);

		$script      = file_get_contents( __DIR__ . '/pwa-load.js' );
		$script_vars = wp_json_encode(
			array(
				// Must be at the admin root so the scope is correct. Move to the
				// wp-admin folder when merging with core.
				'serviceWorkerUrl' => admin_url( '?service-worker' ),
				'logo'             => file_get_contents( ABSPATH . 'wp-admin/images/wordpress-logo-white.svg' ),
				'manifest'         => $manifest,
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
		echo file_get_contents( __DIR__ . '/service-worker.js' );
		exit;
	}
);
