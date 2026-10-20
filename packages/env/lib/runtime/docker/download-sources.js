'use strict';
const { downloadSource } = require( '../../download-sources' );

/**
 * @typedef {import('./config').WPConfig} WPConfig
 * @typedef {import('./config').WPSource} WPSource
 */

/**
 * Download each source for each environment. If the same source is used in
 * multiple environments, it will only be downloaded once.
 *
 * @param {WPConfig} config  The wp-env configuration object.
 * @param {Object}   spinner The spinner object to show progress.
 * @return {Promise} Returns a promise which resolves when the downloads finish.
 */
module.exports = function downloadSources( config, spinner ) {
	const progresses = {};
	const getProgressSetter = ( id ) => ( progress ) => {
		progresses[ id ] = progress;
		spinner.text =
			'Downloading WordPress.\n' +
			Object.entries( progresses )
				.map(
					( [ key, value ] ) =>
						`  - ${ key }: ${ ( value * 100 ).toFixed( 0 ) }%`
				)
				.join( '\n' );
	};

	// Will contain a unique array of sources to download.
	const sources = [];
	const addedSources = {};
	const coreSourceUrls = new Set();
	const addSource = ( source ) => {
		if ( source && source.url && ! addedSources[ source.url ] ) {
			sources.push( source );
			addedSources[ source.url ] = true;
		}
	};

	for ( const envName of Object.keys( config.env ) ) {
		if ( envName === 'tests' && config.testsEnvironment === false ) {
			continue;
		}
		const env = config.env[ envName ];
		env.pluginSources.forEach( addSource );
		env.themeSources.forEach( addSource );
		Object.values( env.mappings ).forEach( addSource );
		addSource( env.coreSource );
		if ( env.coreSource ) {
			coreSourceUrls.add( env.coreSource.url );
		}
	}

	return Promise.all(
		sources.map( ( source ) =>
			downloadSource( source, {
				onProgress: getProgressSetter( source.basename ),
				spinner,
				// A zip download replaces the directory, so the site's configuration has to be carried over.
				preserve: coreSourceUrls.has( source.url )
					? [ 'wp-config.php' ]
					: [],
			} )
		)
	);
};
