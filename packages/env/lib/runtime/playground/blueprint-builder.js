'use strict';

/**
 * Builds a Playground Blueprint from wp-env configuration.
 *
 * @param {Object} config The wp-env config object.
 * @return {Object} Playground Blueprint JSON object.
 */
function buildBlueprint( config ) {
	const envConfig = config.env.development;

	const blueprint = {
		$schema: 'https://playground.wordpress.net/blueprint-schema.json',
		landingPage: '/wp-admin/',
		preferredVersions: {
			php: envConfig.phpVersion || '8.2',
			wp: 'latest',
		},
		steps: [],
	};

	// Login step - matches wp-env default credentials
	blueprint.steps.push( {
		step: 'login',
		username: 'admin',
		password: 'password',
	} );

	// Add plugins
	for ( const plugin of envConfig.pluginSources || [] ) {
		if ( plugin.type === 'local' || plugin.type === 'git' ) {
			// Local and git plugins are mounted via CLI args, just activate
			blueprint.steps.push( {
				step: 'activatePlugin',
				pluginPath: `/wordpress/wp-content/plugins/${ plugin.basename }`,
			} );
		} else if ( plugin.type === 'zip' && plugin.url ) {
			blueprint.steps.push( {
				step: 'installPlugin',
				pluginData: { resource: 'url', url: plugin.url },
				options: { activate: true },
			} );
		} else {
			throw new Error(
				`Plugin source "${ plugin.basename || plugin.path }" of type "${
					plugin.type
				}" ` +
					`is not supported with Playground runtime. Only local, git, and zip plugins are supported.`
			);
		}
	}

	// Note: Themes are mounted via CLI args but NOT activated.
	// This matches Docker runtime behavior where WordPress uses its default theme.
	// Users can activate themes manually or via wp-cli if needed.

	// Configure wp-config constants
	const wpConfigConsts = {};
	for ( const [ key, value ] of Object.entries( envConfig.config || {} ) ) {
		if ( value !== null ) {
			wpConfigConsts[ key ] = value;
		}
	}
	if ( Object.keys( wpConfigConsts ).length > 0 ) {
		blueprint.steps.push( {
			step: 'defineWpConfigConsts',
			consts: wpConfigConsts,
		} );
	}

	// Handle multisite
	if ( envConfig.multisite ) {
		blueprint.steps.push( {
			step: 'enableMultisite',
		} );
	}

	return blueprint;
}

/**
 * Get mount arguments for the Playground CLI.
 *
 * @param {Object} config The wp-env config object.
 * @return {string[]} Array of mount arguments.
 */
function getMountArgs( config ) {
	const args = [];
	const envConfig = config.env.development;

	// Mount plugins
	for ( const plugin of envConfig.pluginSources || [] ) {
		if ( plugin.type === 'local' || plugin.type === 'git' ) {
			args.push(
				'--mount-dir',
				plugin.path,
				`/wordpress/wp-content/plugins/${ plugin.basename }`
			);
		} else if ( plugin.type !== 'zip' ) {
			throw new Error(
				`Plugin source "${ plugin.basename || plugin.path }" of type "${
					plugin.type
				}" ` +
					`is not supported with Playground runtime. Only local, git, and zip plugins are supported.`
			);
		}
	}

	// Mount themes
	// All theme types (local, git, zip) can be mounted after downloading/extraction
	for ( const theme of envConfig.themeSources || [] ) {
		args.push(
			'--mount-dir',
			theme.path,
			`/wordpress/wp-content/themes/${ theme.basename }`
		);
	}

	// Mount custom mappings
	// All source types (local, git, zip) can be mounted after downloading/extraction
	for ( const [ wpDir, source ] of Object.entries(
		envConfig.mappings || {}
	) ) {
		args.push( '--mount-dir', source.path, `/wordpress/${ wpDir }` );
	}

	// Translate core source to Playground's --wp flag or mount it.
	if ( envConfig.coreSource ) {
		if ( envConfig.coreSource.type === 'zip' && envConfig.coreSource.url ) {
			// For zip URLs, let Playground download WordPress natively.
			args.push( '--wp', envConfig.coreSource.url );
		} else if ( envConfig.coreSource.type === 'git' ) {
			// For git sources, pass the version ref to Playground's --wp flag.
			// e.g., WordPress/WordPress#6.5 → --wp 6.5
			// WordPress/WordPress (no ref) → default "latest", no flag needed.
			if ( envConfig.coreSource.ref ) {
				args.push( '--wp', envConfig.coreSource.ref );
			}
		} else {
			// For local sources, mount the directory and tell Playground to
			// use the existing files instead of downloading its own copy.
			args.push(
				'--mount-dir-before-install',
				envConfig.coreSource.path,
				'/wordpress',
				'--wordpress-install-mode',
				'install-from-existing-files-if-needed'
			);
		}
	}

	return args;
}

module.exports = {
	buildBlueprint,
	getMountArgs,
};
