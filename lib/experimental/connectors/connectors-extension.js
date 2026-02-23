/**
 * Example extension script for the Connectors page.
 * Demonstrates how plugins can hook into the page without a build step.
 *
 * This script registers a "Hello World" connector using the wp.connectors API.
 */
( function () {
	'use strict';

	/**
	 * Register the Hello World connector.
	 * Retries if the API isn't available yet.
	 */
	function registerHelloWorldConnector() {
		// Check if wp.connectors API is available
		if (
			typeof wp === 'undefined' ||
			typeof wp.connectors === 'undefined' ||
			typeof wp.connectors.registerConnector !== 'function'
		) {
			setTimeout( registerHelloWorldConnector, 100 );
			return;
		}

		// Register the Hello World connector using the public API
		wp.connectors.registerConnector( 'example/hello-world', {
			label: 'Hello World',
			description:
				'A simple example connector registered via vanilla JS.',
		} );

		// eslint-disable-next-line no-console
		console.log( 'Hello World connector registered!' );
	}

	// Start trying to register
	if ( document.readyState === 'loading' ) {
		document.addEventListener(
			'DOMContentLoaded',
			registerHelloWorldConnector
		);
	} else {
		registerHelloWorldConnector();
	}
} )();
