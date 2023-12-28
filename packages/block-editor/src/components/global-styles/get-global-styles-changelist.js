/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

const globalStylesChangesCache = new Map();
const EMPTY_ARRAY = [];

const translationMap = {
	caption: __( 'Caption' ),
	link: __( 'Link' ),
	button: __( 'Button' ),
	heading: __( 'Heading' ),
	'settings.color': __( 'Color settings' ),
	'settings.typography': __( 'Typography settings' ),
	'styles.color': __( 'Colors' ),
	'styles.spacing': __( 'Spacing' ),
	'styles.typography': __( 'Typography' ),
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

	const keyArray = key.split( '.' );

	if ( keyArray?.[ 0 ] === 'blocks' ) {
		const blockName = blockNames[ keyArray[ 1 ] ];
		return blockName
			? sprintf(
					// translators: %s: block name.
					__( '%s block' ),
					blockName
			  )
			: keyArray[ 1 ];
	}

	if ( keyArray?.[ 0 ] === 'elements' ) {
		return sprintf(
			// translators: %s: element name, e.g., heading button, link, caption.
			__( '%s element' ),
			translationMap[ keyArray[ 1 ] ]
		);
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
		/*
		 * Only return a path if the value has changed.
		 * And then only the path name up to 2 levels deep.
		 */
		return changedObject !== originalObject
			? parentPath.split( '.' ).slice( 0, 2 ).join( '.' )
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
 * Returns an array of translated summarized global styles changes.
 * Results are cached using a Map() key of `JSON.stringify( { next, previous } )`.
 *
 * @param {Object}                next       The changed object to compare.
 * @param {Object}                previous   The original object to compare against.
 * @param {Record<string,string>} blockNames A key/value pair object of block names and their rendered titles.
 * @return {string[]}                        An array of translated changes.
 */
export default function getGlobalStylesChangelist(
	next,
	previous,
	blockNames
) {
	const cacheKey = JSON.stringify( { next, previous } );

	if ( globalStylesChangesCache.has( cacheKey ) ) {
		return globalStylesChangesCache.get( cacheKey );
	}

	/*
	 * Compare the two changesets with normalized keys.
	 * The order of these keys determines the order in which
	 * they'll appear in the results.
	 */
	const changedValueTree = deepCompare(
		{
			styles: {
				color: next?.styles?.color,
				typography: next?.styles?.typography,
				spacing: next?.styles?.spacing,
			},
			blocks: next?.styles?.blocks,
			elements: next?.styles?.elements,
			settings: next?.settings,
		},
		{
			styles: {
				color: previous?.styles?.color,
				typography: previous?.styles?.typography,
				spacing: previous?.styles?.spacing,
			},
			blocks: previous?.styles?.blocks,
			elements: previous?.styles?.elements,
			settings: previous?.settings,
		}
	);

	if ( ! changedValueTree.length ) {
		globalStylesChangesCache.set( cacheKey, EMPTY_ARRAY );
		return EMPTY_ARRAY;
	}

	// Remove duplicate results.
	const result = [ ...new Set( changedValueTree ) ]
		/*
		 * Translate the keys.
		 * Remove duplicate or empty translations.
		 */
		.reduce( ( acc, curr ) => {
			const translation = getTranslation( curr, blockNames );
			if ( translation && ! acc.includes( translation ) ) {
				acc.push( translation );
			}
			return acc;
		}, [] );

	globalStylesChangesCache.set( cacheKey, result );

	return result;
}
