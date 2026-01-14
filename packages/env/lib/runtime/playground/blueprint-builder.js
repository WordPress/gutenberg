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
		if ( plugin.type === 'local' ) {
			// Local plugins are mounted via CLI args, just activate
			blueprint.steps.push( {
				step: 'activatePlugin',
				pluginPath: `/wordpress/wp-content/plugins/${ plugin.basename }`,
			} );
		} else if ( plugin.type === 'zip' && plugin.url ) {
			blueprint.steps.push( {
				step: 'installPlugin',
				pluginZipFile: { url: plugin.url },
				options: { activate: true },
			} );
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
		if ( plugin.type === 'local' ) {
			args.push(
				'--mount',
				`${ plugin.path }:/wordpress/wp-content/plugins/${ plugin.basename }`
			);
		}
	}

	// Mount themes
	for ( const theme of envConfig.themeSources || [] ) {
		if ( theme.type === 'local' ) {
			args.push(
				'--mount',
				`${ theme.path }:/wordpress/wp-content/themes/${ theme.basename }`
			);
		}
	}

	// Mount custom mappings
	for ( const [ wpDir, source ] of Object.entries(
		envConfig.mappings || {}
	) ) {
		if ( source.type === 'local' ) {
			args.push( '--mount', `${ source.path }:/wordpress/${ wpDir }` );
		}
	}

	// Mount core source if specified
	if ( envConfig.coreSource && envConfig.coreSource.type === 'local' ) {
		args.push(
			'--mount-before-install',
			`${ envConfig.coreSource.path }:/wordpress`
		);
	}

	return args;
}

module.exports = {
	buildBlueprint,
	getMountArgs,
};
