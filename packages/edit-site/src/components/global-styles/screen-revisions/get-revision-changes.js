/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

const translationMap = {
	border: __( 'Border' ),
	color: __( 'Colors' ),
	spacing: __( 'Spacing' ),
	typography: __( 'Typography' ),
	'settings.color.palette': __( 'color palette' ),
	'settings.color.gradients': __( 'gradients' ),
	'settings.color.duotone': __( 'duotone colors' ),
	'settings.typography.fontFamilies': __( 'font family settings' ),
	'settings.typography.fontSizes': __( 'font size settings' ),
	'color.text': __( 'text color' ),
	'color.background': __( 'background color' ),
	'spacing.margin.top': __( 'margin top' ),
	'spacing.margin.bottom': __( 'margin bottom' ),
	'spacing.margin.left': __( 'margin left' ),
	'spacing.margin.right': __( 'margin right' ),
	'spacing.padding.top': __( 'padding top' ),
	'spacing.padding.bottom': __( 'padding bottom' ),
	'spacing.padding.left': __( 'padding left' ),
	'spacing.padding.right': __( 'padding right' ),
	'spacing.blockGap': __( 'block gap' ),
	'settings.layout.contentSize': __( 'content size' ),
	'settings.layout.wideSize': __( 'wide size' ),
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

function getTranslation( key ) {
	console.log( 'key', key );

	if ( translationMap[ key ] ) {
		return translationMap[ key ];
	}
	const keyArray = key.split( '.' );

	if ( keyArray?.[ 0 ] === 'blocks' ) {
		let blockName = keyArray[ 1 ].split( '/' )?.[ 1 ];
		blockName = blockName.charAt( 0 ).toUpperCase() + blockName.slice( 1 );
		// @todo maybe getBlockTypes() and find the block name from the block type.
		return sprintf(
			// translators: %1$s: block name, %2$s: changed property.
			__( '%1$s block %2$s' ),
			blockName.replace( /-/g, ' ' ),
			keyArray?.[ 2 ]
		);
	}

	if ( keyArray?.[ 0 ] === 'elements' ) {
		return sprintf(
			// translators: %1$s: block name, %2$s: changed property.
			__( '%1$s element %2$s' ),
			keyArray?.[ 1 ],
			keyArray?.[ 2 ]
		);
	}
}

function shuffle( array ) {
	for ( let i = array.length - 1; i > 0; i-- ) {
		// eslint-disable-next-line no-restricted-syntax
		const j = Math.floor( Math.random() * ( i + 1 ) );
		[ array[ i ], array[ j ] ] = [ array[ j ], array[ i ] ];
	}
	return array;
}

const cache = new Map();

export function getRevisionChanges(
	revision,
	previousRevision,
	maxResults = 4
) {
	if ( cache.has( revision.id ) ) {
		return cache.get( revision.id );
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
	const hasMore = changedValueTree.length > maxResults;
	// Remove dupes and shuffle results.
	let result = shuffle( [ ...new Set( changedValueTree ) ] )
		// Limit to max results.
		.slice( 0, maxResults )
		// Translate the keys.
		.map( ( key ) => getTranslation( key ) )
		.filter( ( str ) => !! str )
		.join( ', ' );

	if ( hasMore ) {
		result += '…';
	}

	cache.set( revision.id, result );

	return result;
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
		// And then only the path name up to 3 levels deep.
		return changedObject !== originalObject
			? parentPath.split( '.' ).slice( 0, 3 ).join( '.' )
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
