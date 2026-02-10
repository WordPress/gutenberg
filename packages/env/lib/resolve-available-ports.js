'use strict';
/**
 * Internal dependencies
 */
const { findAvailablePort, isPortAvailable } = require( './port-utils' );

/**
 * Port definitions to resolve. Each entry maps a config path to its
 * environment and property. MySQL ports are excluded because they
 * already support Docker-native auto-assignment via `null`.
 */
const PORT_DEFINITIONS = [
	{ env: 'development', property: 'port' },
	{ env: 'tests', property: 'port' },
	{ env: 'development', property: 'phpmyadminPort' },
	{ env: 'tests', property: 'phpmyadminPort' },
];

/**
 * Well-known preferred ports for auto-resolved (null) port properties.
 * When a port defaults to null, the resolver tries these first before
 * falling back to an ephemeral port.
 */
const PREFERRED_PORTS = {
	'development.port': 8888,
	'tests.port': 8889,
};

/**
 * Creates a port resolver that tracks used ports and records changes.
 *
 * The resolver is designed to be called during config post-processing,
 * after environments have been merged but before URLs are set. This
 * allows `appendPortToWPConfigs` to use the resolved ports directly.
 *
 * @param {Object} spinner A CLI spinner for displaying progress.
 * @return {Object} A port resolver with `resolve` and `getChanges` methods.
 */
function createPortResolver( spinner ) {
	const usedPorts = [];
	const portChanges = [];

	return {
		/**
		 * Resolves a single port, finding an alternative if it's busy.
		 *
		 * @param {number}  preferredPort The preferred port to use.
		 * @param {string}  configPath    Config path for error messages (e.g. "env.development.port").
		 * @param {boolean} strict        When true, fail if the port is busy instead of finding an alternative.
		 * @return {Promise<number>} The resolved port number.
		 */
		async resolve( preferredPort, configPath, strict = false ) {
			if ( spinner ) {
				spinner.text = `Checking ${ configPath } availability.`;
			}

			// When the user set an explicit port, only use that port.
			if ( strict ) {
				if ( usedPorts.includes( preferredPort ) ) {
					throw new Error(
						`Port ${ preferredPort } (${ configPath }) conflicts with another wp-env service. ` +
							`Set a different port or use null for automatic port selection.`
					);
				}
				const available = await isPortAvailable( preferredPort );
				if ( ! available ) {
					throw new Error(
						`Port ${ preferredPort } (${ configPath }) is busy. ` +
							`Free the port, set a different one, or use null for automatic port selection.`
					);
				}
				usedPorts.push( preferredPort );
				return preferredPort;
			}

			try {
				const resolvedPort = await findAvailablePort( {
					preferredPort,
					exclude: usedPorts,
				} );

				usedPorts.push( resolvedPort );

				if ( resolvedPort !== preferredPort ) {
					portChanges.push( {
						configPath,
						from: preferredPort,
						to: resolvedPort,
					} );
				}

				return resolvedPort;
			} catch ( error ) {
				throw new Error(
					`Could not find available port for ${ configPath }: ${ error.message }`
				);
			}
		},

		/**
		 * Returns all port changes that occurred during resolution.
		 *
		 * @return {Array<{configPath: string, from: number, to: number}>} Port changes.
		 */
		getChanges() {
			return portChanges;
		},
	};
}

/**
 * Resolves available ports on a config object. Iterates over the
 * defined port properties and resolves each one that has a value.
 *
 * @param {Object} config       The config object (after mergeRootToEnvironments).
 * @param {Object} portResolver A port resolver created by `createPortResolver`.
 * @return {Promise<Object>} The config with resolved ports and portChanges attached.
 */
async function resolveConfigPorts( config, portResolver ) {
	for ( const { env, property } of PORT_DEFINITIONS ) {
		const currentValue = config.env[ env ][ property ];

		// Skip unconfigured ports (phpmyadminPort defaults to null
		// and should stay null when not explicitly set).
		if ( currentValue === undefined ) {
			continue;
		}

		// For null ports (auto-resolve), use a well-known preferred port.
		// For explicit ports, use the configured value in strict mode.
		const key = `${ env }.${ property }`;
		const preferredPort = currentValue ?? PREFERRED_PORTS[ key ];

		// Still null after lookup (e.g. phpmyadminPort set to null).
		if ( ! preferredPort ) {
			continue;
		}

		// Only the main web port uses strict mode (fail if busy).
		// Other ports (phpmyadminPort) always auto-fallback.
		const strict = currentValue !== null && property === 'port';
		const configPath = `env.${ key }`;
		config.env[ env ][ property ] = await portResolver.resolve(
			preferredPort,
			configPath,
			strict
		);
	}

	config.portChanges = portResolver.getChanges();
	return config;
}

module.exports = {
	createPortResolver,
	resolveConfigPorts,
	PORT_DEFINITIONS,
};
