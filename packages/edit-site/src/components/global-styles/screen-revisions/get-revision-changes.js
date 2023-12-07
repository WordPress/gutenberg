/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const globalStylesChangesCache = new Map();
const EMPTY_ARRAY = [];

const translationMap = {
	blocks: __( 'Blocks' ),
	elements: __( 'Elements' ),
	'elements.caption': __( 'Caption' ),
	'elements.link': __( 'Link' ),
	'elements.button': __( 'Button' ),
	'elements.heading': __( 'Heading' ),
	settings: __( 'Settings' ),
	'settings.color': __( 'Color' ),
	'settings.typography': __( 'Typography' ),
	'settings.layout': __( 'Layout' ),
	styles: __( 'Styles' ),
	'styles.color.text': __( 'Text' ),
	'styles.color.background': __( 'Background' ),
	'styles.spacing.margin': __( 'Margin' ),
	'styles.spacing.padding': __( 'Padding' ),
	'styles.spacing.blockGap': __( 'Block spacing' ),
	'styles.typography.fontStyle': __( 'Font style' ),
	'styles.typography.fontSize': __( 'Font size' ),
	'styles.typography.lineHeight': __( 'Line height' ),
	'styles.typography.fontFamily': __( 'Font family' ),
	'styles.typography.fontWeight': __( 'Font weight' ),
};

const isObject = ( obj ) => obj !== null && typeof obj === 'object';

/**
 * Get the translation for a given global styles key.
 * @param {string}                key        A key representing a path to a global style property or setting.
 * @param {Record<string,string>} blockNames A key/value pair object of block names and their rendered titles.
 * @return {string|undefined}                A translated key or undefined if no translation exists.
 */
function getTranslation( key, blockNames ) {
	if ( translationMap[ key ] ) {
		return translationMap[ key ];
	}
	if ( key.startsWith( 'blocks.' ) ) {
		const keyArray = key.split( '.' );
		return blockNames[ keyArray[ 1 ] ] || keyArray[ 1 ];
	}

	return undefined;
}

/**
 * A deep comparison of two objects, optimized for comparing global styles.
 * @param {Object} changedObject  The changed object to compare.
 * @param {Object} originalObject The original object to compare against.
 * @param {string} parentPath     A key/value pair object of block names and their rendered titles.
 * @return {string[]}             An array of paths whose values have changed.
 */
function deepCompare( changedObject, originalObject, parentPath = '' ) {
	// We have two non-object values to compare.
	if ( ! isObject( changedObject ) && ! isObject( originalObject ) ) {
		// Only return a path if the value has changed.
		// And then only the path name up to `n` levels deep to reduce the results.
		const splitKeys = parentPath.split( '.' );
		const depth = 'styles' === splitKeys[ 0 ] ? 3 : 2;
		return changedObject !== originalObject
			? splitKeys.slice( 0, depth ).join( '.' )
			: undefined;
	}

	// Enable comparison when an object doesn't have a corresponding property to compare.
	changedObject = isObject( changedObject ) ? changedObject : {};
	originalObject = isObject( originalObject ) ? originalObject : {};

	const allKeys = new Set( [
		...Object.keys( changedObject ),
		...Object.keys( originalObject ),
	] );

	let diffs = [];
	for ( const key of allKeys ) {
		const path = parentPath ? parentPath + '.' + key : key;
		const changedPath = deepCompare(
			changedObject[ key ],
			originalObject[ key ],
			path
		);
		if ( changedPath ) {
			diffs = diffs.concat( changedPath );
		}
	}
	return diffs;
}

/**
 * Get an array of translated summarized global styles changes.
 * Results are cached using a Map() key of `JSON.stringify( { revision, previousRevision } )`.
 *
 * @param {Object}                revision         The changed object to compare.
 * @param {Object}                previousRevision The original object to compare against.
 * @param {Record<string,string>} blockNames       A key/value pair object of block names and their rendered titles.
 * @return {Array[]}                               An 2-dimensional array of tuples: [ "group", "translated change" ].
 */
export default function getRevisionChanges(
	revision,
	previousRevision,
	blockNames
) {
	const cacheKey = JSON.stringify( { revision, previousRevision } );

	if ( globalStylesChangesCache.has( cacheKey ) ) {
		return globalStylesChangesCache.get( cacheKey );
	}

	// Compare the two revisions with normalized keys.
	const changedValueTree = deepCompare(
		{
			blocks: revision?.styles?.blocks,
			styles: {
				color: revision?.styles?.color,
				typography: revision?.styles?.typography,
				spacing: revision?.styles?.spacing,
			},
			elements: revision?.styles?.elements,
			settings: revision?.settings,
		},
		{
			blocks: previousRevision?.styles?.blocks,
			styles: {
				color: previousRevision?.styles?.color,
				typography: previousRevision?.styles?.typography,
				spacing: previousRevision?.styles?.spacing,
			},
			elements: previousRevision?.styles?.elements,
			settings: previousRevision?.settings,
		}
	);

	if ( ! changedValueTree.length ) {
		globalStylesChangesCache.set( cacheKey, EMPTY_ARRAY );
		return EMPTY_ARRAY;
	}

	// Remove duplicate results.
	const result = [ ...new Set( changedValueTree ) ]
		// Translate the keys.
		// Remove duplicate or empty translations.
		.reduce( ( acc, curr ) => {
			const translation = getTranslation( curr, blockNames );
			if ( translation && ! acc.includes( translation ) ) {
				acc.push( [
					translationMap[ curr.split( '.' )[ 0 ] ],
					translation,
				] );
			}
			return acc;
		}, [] );

	globalStylesChangesCache.set( cacheKey, result );

	return result;
}
