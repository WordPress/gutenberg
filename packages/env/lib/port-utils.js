'use strict';
/**
 * External dependencies
 */
const net = require( 'net' );

/**
 * Default port range bounds.
 */
const DEFAULT_MIN_PORT = 1024;
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
 *
 * @param {Object}   options               Options for finding a port.
 * @param {number}   options.preferredPort The preferred port to try first.
 * @param {?number}  options.min           Minimum port number (default: 1024).
 * @param {?number}  options.max           Maximum port number (default: 65535).
 * @param {number[]} options.exclude       Ports to exclude from selection.
 * @return {Promise<number>} An available port number.
 * @throws {Error} If no available port is found within the range.
 */
async function findAvailablePort( {
	preferredPort,
	min = null,
	max = null,
	exclude = [],
} ) {
	const effectiveMin = min ?? DEFAULT_MIN_PORT;
	const effectiveMax = max ?? DEFAULT_MAX_PORT;

	// Try the preferred port first if it's within range and not excluded
	if (
		preferredPort >= effectiveMin &&
		preferredPort <= effectiveMax &&
		! exclude.includes( preferredPort )
	) {
		const isAvailable = await isPortAvailable( preferredPort );
		if ( isAvailable ) {
			return preferredPort;
		}
	}

	// If preferred port is not available, search for an available port
	// Start from preferred port if within range, otherwise start from min
	const startPort =
		preferredPort >= effectiveMin && preferredPort <= effectiveMax
			? preferredPort
			: effectiveMin;

	// Search forward from start port to max
	for ( let port = startPort; port <= effectiveMax; port++ ) {
		if ( exclude.includes( port ) ) {
			continue;
		}
		const isAvailable = await isPortAvailable( port );
		if ( isAvailable ) {
			return port;
		}
	}

	// Search backward from start port to min (if we started above min)
	if ( startPort > effectiveMin ) {
		for ( let port = startPort - 1; port >= effectiveMin; port-- ) {
			if ( exclude.includes( port ) ) {
				continue;
			}
			const isAvailable = await isPortAvailable( port );
			if ( isAvailable ) {
				return port;
			}
		}
	}

	throw new Error(
		`No available port found in range ${ effectiveMin }-${ effectiveMax }.`
	);
}

module.exports = {
	isPortAvailable,
	findAvailablePort,
	DEFAULT_MIN_PORT,
	DEFAULT_MAX_PORT,
};
