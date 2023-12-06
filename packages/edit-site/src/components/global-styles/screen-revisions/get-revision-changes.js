/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

const globalStylesChangesCache = new Map();

const translationMap = {
	caption: __( 'caption' ),
	link: __( 'link' ),
	button: __( 'button' ),
	heading: __( 'heading' ),
	'settings.color': __( 'color settings' ),
	'settings.typography': __( 'typography settings' ),
	'color.text': __( 'text colors' ),
	'color.background': __( 'background colors' ),
	'spacing.margin': __( 'margin styles' ),
	'spacing.padding': __( 'padding styles' ),
	'spacing.blockGap': __( 'block spacing' ),
	'settings.layout': __( 'layout settings' ),
	'typography.fontStyle': __( 'font style' ),
	'typography.fontSize': __( 'font size' ),
	'typography.lineHeight': __( 'line height' ),
	'typography.fontFamily': __( 'font family' ),
	'typography.fontWeight': __( 'font weight' ),
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
		// Only return a path if the value has changed.
		// And then only the path name up to 2 levels deep.
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
 * Get an array of translated summarized global styles changes.
 * Results are cached using a WeakMap key of `{ revision, previousRevision }`.
 *
 * @param {Object}                revision         The changed object to compare.
 * @param {Object}                previousRevision The original object to compare against.
 * @param {Record<string,string>} blockNames       A key/value pair object of block names and their rendered titles.
 * @return {string[]}                              An array of translated changes.
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
			color: revision?.styles?.color,
			typography: revision?.styles?.typography,
			spacing: revision?.styles?.spacing,
			elements: revision?.styles?.elements,
			settings: revision?.settings,
		},
		{
			blocks: previousRevision?.styles?.blocks,
			color: previousRevision?.styles?.color,
			typography: previousRevision?.styles?.typography,
			spacing: previousRevision?.styles?.spacing,
			elements: previousRevision?.styles?.elements,
			settings: previousRevision?.settings,
		}
	);

	// Remove duplicate results.
	const result = [ ...new Set( changedValueTree ) ]
		// Translate the keys.
		// Remove duplicate or empty translations.
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
