/**
 * External dependencies
 */
const { kebabCase } = require( 'lodash' );
const { copy } = require( 'fs-extra' );
const replaceInFile = require( 'replace-in-file' );

/**
 * Internal dependencies
 */
const { getArgsFromCLI, fromTemplatesRoot } = require( '../utils' );

const blockTitle = getArgsFromCLI()[ 0 ];
if ( ! blockTitle ) {
	process.stdout.write( 'No block name provided.' );
	process.exit( 1 );
}
const blockName = kebabCase( blockTitle );
const pluginName = `${ blockName }-plugin`;
const pluginPath = `./${ pluginName }`

;( async () => {
	await copy( fromTemplatesRoot( 'block-plugin' ), pluginPath );
	await replaceInFile( {
		files: `${ pluginPath }/**`,
		from: [
			/block(_|-)plugin\1block\1title/g,
			/block(_|-)plugin\1block\1name/g,
			/block(_|-)plugin\1name/g,
		],
		to: [ blockTitle, blockName, pluginName ],
	} );
} )();
