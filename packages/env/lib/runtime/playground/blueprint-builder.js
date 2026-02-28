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

	// Match Docker runtime defaults:
	// - Set the site title to the project name (Docker uses --title in wp core install)
	// - Enable pretty permalinks (Docker uses: wp rewrite structure '/%year%/%monthnum%/%day%/%postname%/' --hard)
	//
	// NOTE: We must use $wp_rewrite->set_permalink_structure() rather than
	// update_option('permalink_structure', ...) because the WP_Rewrite object
	// was already loaded with the default (empty) permalink structure during
	// wp-load.php. update_option() only updates the DB; flush_rewrite_rules()
	// reads from the in-memory $wp_rewrite->permalink_structure which would
	// still be empty, so no rewrite rules (including /wp-json/) would be generated.
	blueprint.steps.push( {
		step: 'runPHP',
		code: `<?php
			require '/wordpress/wp-load.php';
			update_option( 'blogname', '${ config.name }' );
			global $wp_rewrite;
			$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
			flush_rewrite_rules();
		`,
	} );

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
			if ( envConfig.coreSource.ref ) {
				// For git sources with a specific ref, pass it to --wp.
				// e.g., WordPress/WordPress#6.5 → --wp 6.5
				args.push( '--wp', envConfig.coreSource.ref );
			} else {
				// No ref means "latest" — mount the cloned repo so we get
				// the full distribution (all bundled themes, etc.) rather
				// than Playground's trimmed-down WordPress package.
				// Use 'install-from-existing-files' (not '-if-needed') to
				// force a fresh WordPress installation on every start. The
				// '-if-needed' variant skips installation when it detects
				// existing files, which causes stale database state when
				// the same environment is stopped and restarted.
				args.push(
					'--mount-dir-before-install',
					envConfig.coreSource.path,
					'/wordpress',
					'--wordpress-install-mode',
					'install-from-existing-files'
				);
			}
		} else {
			// For local sources, mount the directory and tell Playground to
			// use the existing files instead of downloading its own copy.
			args.push(
				'--mount-dir-before-install',
				envConfig.coreSource.path,
				'/wordpress',
				'--wordpress-install-mode',
				'install-from-existing-files'
			);
		}
	}

	return args;
}

module.exports = {
	buildBlueprint,
	getMountArgs,
};
