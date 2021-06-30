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
		$manifest_url = admin_url() . '/?manifest';
		echo '<link rel="manifest" href="' . $manifest_url . '">';
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
