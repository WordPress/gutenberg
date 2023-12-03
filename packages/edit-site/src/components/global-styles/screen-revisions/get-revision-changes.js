/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

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

function getTranslation( key, blockNames ) {
	if ( translationMap[ key ] ) {
		return translationMap[ key ];
	}
	const keyArray = key.split( '.' );

	if ( keyArray?.[ 0 ] === 'blocks' ) {
		const blockName = blockNames[ keyArray[ 1 ] ];
		return sprintf(
			// translators: %s: block name.
			__( '%s block' ),
			blockName
		);
	}

	if ( keyArray?.[ 0 ] === 'elements' ) {
		return sprintf(
			// translators: %s: element name, e.g., heading button, link, caption.
			__( '%s element' ),
			translationMap[ keyArray[ 1 ] ]
		);
	}
}

const cache = new WeakMap();

export function getRevisionChanges(
	revision,
	previousRevision,
	blockNames,
	maxResults = 5
) {
	if ( cache.has( revision ) ) {
		return cache.get( revision );
	}

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

	const slicedResult = result.slice( 0, maxResults );

	if ( result.length > maxResults ) {
		// translators: follows comma-separated list of changed styles.
		slicedResult.push( __( 'and more.' ) );
	}

	const joined = slicedResult.join( ', ' );
	cache.set( revision, joined );
	return joined;
}

function isObject( obj ) {
	return obj !== null && typeof obj === 'object';
}

function deepCompare(
	changedObject,
	originalObject,
	depth = 0,
	parentPath = ''
) {
	if ( ! isObject( changedObject ) && ! isObject( originalObject ) ) {
		// Only return a path if the value has changed.
		// And then only the path name up to 2 levels deep.
		return changedObject !== originalObject
			? parentPath.split( '.' ).slice( 0, 2 ).join( '.' )
			: undefined;
	}

	changedObject = isObject( changedObject ) ? changedObject : {};
	originalObject = isObject( originalObject ) ? originalObject : {};

	const changedKeys = Object.keys( changedObject );
	const originalKeys = Object.keys( originalObject );
	const allKeys = new Set( [ ...changedKeys, ...originalKeys ] );

	let diffs = [];
	for ( const key of allKeys ) {
		const path = parentPath ? parentPath + '.' + key : key;
		const changedPath = deepCompare(
			changedObject[ key ],
			originalObject[ key ],
			depth + 1,
			path
		);
		if ( changedPath ) {
			diffs = diffs.concat( changedPath );
		}
	}
	return diffs;
}
