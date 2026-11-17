'use strict';
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
				// Listening can succeed while another server answers on the
				// port: one on 127.0.0.1 or ::1 only, or, on Windows, one
				// that set SO_REUSEADDR, like PHP's built-in server.
				isPortAnswering( port ).then( ( answering ) =>
					resolve( ! answering )
				);
			} );
		} );

		server.listen( port, '0.0.0.0' );
	} );
}

/**
 * Checks if a server on this computer answers on a port. Unlike listening,
 * connecting doesn't make Windows ask to open the firewall.
 *
 * @param {number} port The port to check.
 * @return {Promise<boolean>} True if a server answers, false otherwise.
 */
function isPortAnswering( port ) {
	return new Promise( ( resolve ) => {
		const socket = net.connect( port, 'localhost' );
		socket.once( 'connect', () => {
			socket.destroy();
			resolve( true );
		} );
		socket.once( 'error', () => resolve( false ) );
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
	isPortAnswering,
	findAvailablePort,
	DEFAULT_MIN_PORT,
	DEFAULT_MAX_PORT,
};
