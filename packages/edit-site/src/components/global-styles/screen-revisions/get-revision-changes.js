/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const translationMap = {
	blocks: __( 'Block styles' ),
	border: __( 'Border' ),
	color: __( 'Colors' ),
	elements: __( 'Elements' ),
	link: __( 'Links' ),
	layout: __( 'Layout' ),
	spacing: __( 'Spacing' ),
	typography: __( 'Typography' ),
};

/**
 * Returns an array of translated strings describing high level global styles and settings.
 *
 * @param {Object} revision
 * @param {Object} revision.settings Global styles settings.
 * @param {Object} revision.styles   Global styles.
 * @return {string[] | []} An array of translated labels.
 */
export function getGlobalStylesChanges( { settings = {}, styles = {} } ) {
	const changes = [];
	if ( Object.keys( settings ).length > 0 ) {
		changes.push( __( 'Global settings' ) );
	}
	Object.keys( styles ).forEach( ( key ) => {
		if ( translationMap[ key ] ) {
			changes.push( translationMap[ key ] );
		}
	} );

	return changes;
}

const shuffle = ( array ) => {
	for ( let i = array.length - 1; i > 0; i-- ) {
		// eslint-disable-next-line no-restricted-syntax
		const j = Math.floor( Math.random() * ( i + 1 ) );
		[ array[ i ], array[ j ] ] = [ array[ j ], array[ i ] ];
	}
	return array;
};

const cache = {}; // Should be a Set?

export function getRevisionChanges(
	revision,
	previousRevision,
	maxResults = 10
) {
	if ( cache[ revision.id ] ) {
		return cache[ revision.id ];
	}
console.log( 'revision, previousRevision', revision, previousRevision );
	const changedValueTree = deepCompare(
		{
			blocks: revision?.styles?.blocks,
			elements: revision?.styles?.elements,
			color: revision?.styles?.color,
			typography: revision?.styles?.typography,
			dimensions: revision?.styles?.dimensions,
			spacing: revision?.styles?.spacing,
			border: revision?.styles?.border,
			settingsColor: revision?.settings?.color,
		},
		{
			blocks: previousRevision?.styles?.blocks,
			elements: previousRevision?.styles?.elements,
			color: previousRevision?.styles?.color,
			typography: previousRevision?.styles?.typography,
			dimensions: previousRevision?.styles?.dimensions,
			spacing: previousRevision?.styles?.spacing,
			border: previousRevision?.styles?.border,
			settingsColor: previousRevision?.settings?.color,
		}
	);


	console.log( 'flattenedChanges', changedValueTree);
	const shuffled = shuffle(
		changedValueTree.filter( ( { hasChanged, path } ) => hasChanged )
	);
	console.log( 'shuffled', shuffled );
	/*	cache[ revision.id ] = shuffled
		.slice( 0, maxResults )
		.map( ( { path } ) => path )
		.join( ', ' );

	return cache[ revision.id ];*/
}

function isObject( obj ) {
	return obj !== null && typeof obj === 'object';
}

function deepCompare( revisionValue, configValue, depth = 0, parentPath = '' ) {
	if ( ! isObject( revisionValue ) && ! isObject( configValue ) ) {
		return [
			{
				path: parentPath,
				revisionValue,
				configValue,
				hasChanged: revisionValue !== configValue,
			},
		];
	}

	revisionValue = isObject( revisionValue ) ? revisionValue : {};
	configValue = isObject( configValue ) ? configValue : {};

	const keys1 = Object.keys( revisionValue );
	const keys2 = Object.keys( configValue );
	const allKeys = new Set( [ ...keys1, ...keys2 ] );

	let diffs = [];
	for ( const key of allKeys ) {
		const path = parentPath ? parentPath + '.' + key : key;
		const subDiffs = deepCompare(
			revisionValue[ key ],
			configValue[ key ],
			depth + 1,
			path
		);
		diffs = diffs.concat( subDiffs );
	}
/*	diffs = diffs.filter(
		( diff ) =>
			diff.path.includes( 'behaviors' ) ||
			diff.path.includes( 'settings' ) ||
			diff.path.includes( 'styles' )
	);*/
	return diffs;
}
