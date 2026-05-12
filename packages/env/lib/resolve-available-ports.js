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
 * Well-known preferred ports for auto-resolved HTTP port properties.
 * Auto-port tries these first and then scans upward to find a free port.
 */
const PREFERRED_PORTS = {
	'development.port': 8888,
	'tests.port': 8889,
};

/**
 * Creates a port resolver that tracks used ports.
 *
 * The resolver is designed to be called during config post-processing,
 * after environments have been merged but before URLs are set. This
 * allows `appendPortToWPConfigs` to use the resolved ports directly.
 *
 * @param {Object} spinner A CLI spinner for displaying progress.
 * @return {Object} A port resolver with a `resolve` method.
 */
function createPortResolver( spinner ) {
	const usedPorts = [];

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
							`Set a different port or enable automatic port selection with --auto-port or "autoPort": true.`
					);
				}
				const available = await isPortAvailable( preferredPort );
				if ( ! available ) {
					throw new Error(
						`Port ${ preferredPort } (${ configPath }) is busy. ` +
							`Free the port, set a different one, or enable automatic port selection with --auto-port or "autoPort": true.`
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

				// Inform the user via the existing spinner channel when the
				// preferred port was busy and we fell back to a different
				// one. Reuses the same spinner instance the resolver already
				// holds — introducing a separate logger or stream would be
				// a regression detected by the test suite (AC7).
				if ( spinner && resolvedPort !== preferredPort ) {
					spinner.info(
						`Port ${ preferredPort } (${ configPath }) was busy; using ${ resolvedPort } instead.`
					);
					spinner.start();
				}

				usedPorts.push( resolvedPort );

				return resolvedPort;
			} catch ( error ) {
				throw new Error(
					`Could not find available port for ${ configPath }: ${ error.message }`
				);
			}
		},
	};
}

/**
 * Resolves available ports on a config object. Iterates over the
 * defined port properties and resolves each one that has a value.
 *
 * @param {Object}                      config                       The config object (after mergeRootToEnvironments).
 * @param {Object}                      portResolver                 A port resolver created by `createPortResolver`.
 * @param {Object}                      [options]                    Routing options.
 * @param {'off'|'all'|'defaults-only'} [options.autoPortMode]       The auto-port routing mode. `'off'` forces strict per-port (production never reaches this branch because the resolver itself is not created in `'off'` mode). `'all'` mirrors today's `--auto-port` behavior — every port (including phpmyadminPort) auto-falls-back. `'defaults-only'` only auto-falls-back HTTP ports whose value originated from the default config; user-set HTTP ports stay strict, and `phpmyadminPort` is skipped entirely (preserving today's behavior verbatim — phpmyadminPort is only resolved when the user explicitly opts in via `--auto-port`).
 * @param {Set<string>}                 [options.defaultOriginPorts] The set of port keys (e.g. `'development.port'`, `'tests.port'`) whose effective value comes from the default config rather than any user-supplied source. Used by `'defaults-only'` mode.
 * @return {Promise<Object>} The config with resolved ports.
 */
async function resolveConfigPorts(
	config,
	portResolver,
	{ autoPortMode = 'off', defaultOriginPorts = new Set() } = {}
) {
	for ( const { env, property } of PORT_DEFINITIONS ) {
		const currentValue = config.env[ env ][ property ];

		// Skip unconfigured ports (phpmyadminPort defaults to null
		// and should stay null when not explicitly set).
		if ( currentValue === undefined ) {
			continue;
		}

		// Per-port skip rule. Under `defaults-only` mode we deliberately
		// do not resolve `phpmyadminPort` at all so its behavior is
		// identical to today's: it is only auto-resolved when the user
		// has explicitly opted in via `--auto-port` (the `'all'` mode).
		if ( autoPortMode === 'defaults-only' && property !== 'port' ) {
			continue;
		}

		// Use a well-known preferred port when one isn't explicitly set.
		// For explicit ports, use the configured value.
		const key = `${ env }.${ property }`;
		const preferredPort = currentValue ?? PREFERRED_PORTS[ key ];

		// Still null after lookup (e.g. phpmyadminPort set to null).
		if ( ! preferredPort ) {
			continue;
		}

		// Decide whether this port participates in auto-fallback.
		// - `'off'`  → strict (defensive; the resolver is normally not
		//   created in this mode, so this branch is reachable only when
		//   the function is unit-tested directly).
		// - `'all'`  → non-strict for every port. Preserves today's
		//   `--auto-port` behavior, including the phpmyadminPort path.
		// - `'defaults-only'` → non-strict only for HTTP ports whose value
		//   came from `DEFAULT_ENVIRONMENT_CONFIG`. User-set HTTP ports
		//   stay strict so the existing port-busy error surfaces.
		let strict;
		if ( autoPortMode === 'off' ) {
			strict = true;
		} else if ( autoPortMode === 'all' ) {
			strict = false;
		} else {
			// 'defaults-only' — only `property === 'port'` reaches here
			// because of the skip rule above.
			strict = ! defaultOriginPorts.has( key );
		}

		const configPath = `env.${ key }`;
		config.env[ env ][ property ] = await portResolver.resolve(
			preferredPort,
			configPath,
			strict
		);
	}

	return config;
}

module.exports = {
	createPortResolver,
	resolveConfigPorts,
	PORT_DEFINITIONS,
};
