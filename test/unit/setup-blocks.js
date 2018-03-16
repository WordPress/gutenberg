/**
 * External dependencies
 */
const glob = require( 'glob' );

// Bootstrap server-registered blocks
global.window._wpBlocks = glob.
	sync( 'blocks/library/*/settings.json' ).
	reduce( ( blockTypes, fileName ) => {
		const { name, variations = [], ...settings } = require( fileName );

		const blockTypeVariations = variations.reduce( ( memo, variationName ) => {
			return {
				...memo,
				[ variationName ]: settings,
			};
		}, {} );

		return {
			...blockTypes,
			[ name ]: settings,
			...blockTypeVariations,
		};
	}, {} );
