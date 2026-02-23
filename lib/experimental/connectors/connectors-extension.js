/**
 * Example extension script for the Connectors page.
 * Demonstrates how plugins can register a connector using the @wordpress/connectors API.
 *
 * This script registers a "Hello World" connector to show how plugins can
 * add their own connectors to the Connectors settings page.
 */
import { registerConnector } from '@wordpress/connectors';

// Register the Hello World connector
registerConnector( 'example/hello-world', {
	label: 'Hello World',
	description: 'A simple example connector registered via script module.',
} );

// eslint-disable-next-line no-console
console.log( 'Hello World connector registered!' );
