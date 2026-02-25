'use strict';
/**
 * External dependencies
 */
const net = require( 'net' );

const DEFAULT_MIN_PORT = 49152;
const DEFAULT_MAX_PORT = 65535;

/**
 * Checks if a port is available for use.
 *
 * @param {number} port The port to check.
 * @return {Promise<boolean>} True if the port is available, false otherwise.
 */
async function isPortAvailable( port ) {
	return new Promise( ( resolve ) => {
		const server = net.createServer();

		server.once( 'error', ( err ) => {
			if ( err.code === 'EADDRINUSE' || err.code === 'EACCES' ) {
				resolve( false );
			} else {
				// For other errors, assume port is not available
				resolve( false );
			}
		} );

		server.once( 'listening', () => {
			server.close( () => {
				resolve( true );
			} );
		} );

		server.listen( port, '0.0.0.0' );
	} );
}

/**
 * Finds an available port, starting with the preferred port.
 * Falls back to scanning upward from the preferred port.
 *
 * @param {Object}   options               Options for finding a port.
 * @param {number}   options.preferredPort The preferred port to try first.
 * @param {number}   options.minPort       Minimum port for fallback scanning.
 * @param {number}   options.maxPort       Maximum port for fallback scanning.
 * @param {number[]} options.exclude       Ports to exclude from selection.
 * @return {Promise<number>} An available port number.
 * @throws {Error} If no available port is found within the range.
 */
async function findAvailablePort( {
	preferredPort,
	minPort = preferredPort,
	maxPort = DEFAULT_MAX_PORT,
	exclude = [],
} ) {
	// Try the preferred port first if it's not excluded
	if ( ! exclude.includes( preferredPort ) ) {
		const isAvailable = await isPortAvailable( preferredPort );
		if ( isAvailable ) {
			return preferredPort;
		}
	}

	// If preferred port is not available, scan upward from the selected minimum.
	const startPort = Math.max( minPort, preferredPort + 1 );
	for ( let port = startPort; port <= maxPort; port++ ) {
		if ( exclude.includes( port ) ) {
			continue;
		}
		const isAvailable = await isPortAvailable( port );
		if ( isAvailable ) {
			return port;
		}
	}

	throw new Error(
		`No available port found in range ${ startPort }-${ maxPort }.`
	);
}

module.exports = {
	isPortAvailable,
	findAvailablePort,
	DEFAULT_MIN_PORT,
	DEFAULT_MAX_PORT,
};
