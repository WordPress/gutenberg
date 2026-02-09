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
		 * @param {number} preferredPort The preferred port to use.
		 * @param {string} configPath    Config path for error messages (e.g. "env.development.port").
		 * @return {Promise<number>} The resolved port number.
		 */
		async resolve( preferredPort, configPath ) {
			if ( spinner ) {
				spinner.text = `Checking ${ configPath } availability.`;
			}

			// When auto-port selection is disabled, only use the configured port.
			if ( process.env.WP_ENV_AUTO_PORT === 'false' ) {
				if ( usedPorts.includes( preferredPort ) ) {
					throw new Error(
						`Port ${ preferredPort } (${ configPath }) conflicts with another wp-env service. ` +
							`Set a different port or enable automatic port selection with WP_ENV_AUTO_PORT=true.`
					);
				}
				const available = await isPortAvailable( preferredPort );
				if ( ! available ) {
					throw new Error(
						`Port ${ preferredPort } (${ configPath }) is busy. ` +
							`Free the port, set a different one, or enable automatic port selection with WP_ENV_AUTO_PORT=true.`
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

		// Skip ports that aren't configured (null/undefined).
		if ( ! currentValue ) {
			continue;
		}

		const configPath = `env.${ env }.${ property }`;
		config.env[ env ][ property ] = await portResolver.resolve(
			currentValue,
			configPath
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
