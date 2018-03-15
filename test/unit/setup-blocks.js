/**
 * External dependencies
 */
const glob = require( 'glob' );

// Bootstrap server-registered blocks
global.window._wpBlocks = glob.
	sync( 'blocks/library/*/settings.json' ).
	reduce( ( blocks, fileName ) => {
		const { name, ...settings } = require( fileName );

		return {
			...blocks,
			[ name ]: settings,
		};
	}, {} );
