/**
 * External dependencies
 */
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
// @ts-expect-error blocks package not typed yet.
import { getBlockTypes } from '@wordpress/blocks';

type TranslationMap = Record< string, string >;
type BlockNamesMap = Record< string, string >;
type ChangeEntry = [ string, string ];

interface GetGlobalStylesChangesOptions {
	maxResults?: number;
}

const globalStylesChangesCache = new Map< string, ChangeEntry[] >();
const EMPTY_ARRAY: string[] = [];
const translationMap: TranslationMap = {
	caption: __( 'Caption' ),
	link: __( 'Link' ),
	button: __( 'Button' ),
	heading: __( 'Heading' ),
	h1: __( 'H1' ),
	h2: __( 'H2' ),
	h3: __( 'H3' ),
	h4: __( 'H4' ),
	h5: __( 'H5' ),
	h6: __( 'H6' ),
	'settings.color': __( 'Color' ),
	'settings.typography': __( 'Typography' ),
	'settings.shadow': __( 'Shadow' ),
	'settings.layout': __( 'Layout' ),
	'styles.color': __( 'Colors' ),
	'styles.spacing': __( 'Spacing' ),
	'styles.background': __( 'Background' ),
	'styles.typography': __( 'Typography' ),
};
const getBlockNames = memoize(
	(): BlockNamesMap =>
		getBlockTypes().reduce< BlockNamesMap >(
			(
				accumulator: BlockNamesMap,
				{
					name,
					title,
				}: {
					name: string;
					title: string;
				}
			) => {
				accumulator[ name ] = title;
				return accumulator;
			},
			{}
		)
);
const isObject = ( obj: any ): obj is Record< string, any > =>
	obj !== null && typeof obj === 'object';

/**
 * Get the translation for a given global styles key.
 * @param key A key representing a path to a global style property or setting.
 * @return A translated key or undefined if no translation exists.
 */
function getTranslation( key: string ): string | undefined {
	if ( translationMap[ key ] ) {
		return translationMap[ key ];
	}

	const keyArray = key.split( '.' );

	if ( keyArray?.[ 0 ] === 'blocks' ) {
		const blockName = getBlockNames()?.[ keyArray[ 1 ] ];
		return blockName || keyArray[ 1 ];
	}

	if ( keyArray?.[ 0 ] === 'elements' ) {
		return translationMap[ keyArray[ 1 ] ] || keyArray[ 1 ];
	}

	return undefined;
}

/**
 * A deep comparison of two objects, optimized for comparing global styles.
 * @param changedObject  The changed object to compare.
 * @param originalObject The original object to compare against.
 * @param parentPath     A key/value pair object of block names and their rendered titles.
 * @return An array of paths whose values have changed.
 */
function deepCompare(
	changedObject: any,
	originalObject: any,
	parentPath: string = ''
): string | string[] | undefined {
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

	let diffs: string[] = [];
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
 * @param next     The changed object to compare.
 * @param previous The original object to compare against.
 * @return A 2-dimensional array of tuples: [ "group", "translated change" ].
 */
export function getGlobalStylesChangelist(
	next: any,
	previous: any
): ChangeEntry[] {
	const cacheKey = JSON.stringify( { next, previous } );

	if ( globalStylesChangesCache.has( cacheKey ) ) {
		return globalStylesChangesCache.get( cacheKey )!;
	}

	/*
	 * Compare the two changesets with normalized keys.
	 * The order of these keys determines the order in which
	 * they'll appear in the results.
	 */
	const changedValueTree = deepCompare(
		{
			styles: {
				background: next?.styles?.background,
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
				background: previous?.styles?.background,
				color: previous?.styles?.color,
				typography: previous?.styles?.typography,
				spacing: previous?.styles?.spacing,
			},
			blocks: previous?.styles?.blocks,
			elements: previous?.styles?.elements,
			settings: previous?.settings,
		}
	);

	if (
		! changedValueTree ||
		( Array.isArray( changedValueTree ) && ! changedValueTree.length )
	) {
		globalStylesChangesCache.set( cacheKey, [] );
		return [];
	}

	const changedValueArray = Array.isArray( changedValueTree )
		? changedValueTree
		: [ changedValueTree ];

	// Remove duplicate results.
	const result = [ ...new Set( changedValueArray ) ]
		/*
		 * Translate the keys.
		 * Remove empty translations.
		 */
		.reduce< ChangeEntry[] >( ( acc, curr ) => {
			const translation = getTranslation( curr );
			if ( translation ) {
				acc.push( [ curr.split( '.' )[ 0 ], translation ] );
			}
			return acc;
		}, [] );

	globalStylesChangesCache.set( cacheKey, result );

	return result;
}

/**
 * From a getGlobalStylesChangelist() result, returns an array of translated global styles changes, grouped by type.
 * The types are 'blocks', 'elements', 'settings', and 'styles'.
 *
 * @param next     The changed object to compare.
 * @param previous The original object to compare against.
 * @param options  Options. maxResults: results to return before truncating.
 * @return An array of translated changes.
 */
export default function getGlobalStylesChanges(
	next: any,
	previous: any,
	options: GetGlobalStylesChangesOptions = {}
): string[] {
	let changeList = getGlobalStylesChangelist( next, previous );
	const changesLength = changeList.length;
	const { maxResults } = options;

	if ( changesLength ) {
		// Truncate to `n` results if necessary.
		if ( !! maxResults && changesLength > maxResults ) {
			changeList = changeList.slice( 0, maxResults );
		}
		return Object.entries(
			changeList.reduce< Record< string, string[] > >( ( acc, curr ) => {
				const group = acc[ curr[ 0 ] ] || [];
				if ( ! group.includes( curr[ 1 ] ) ) {
					acc[ curr[ 0 ] ] = [ ...group, curr[ 1 ] ];
				}
				return acc;
			}, {} )
		).map( ( [ key, changeValues ] ) => {
			const changeValuesLength = changeValues.length;
			const joinedChangesValue = changeValues.join(
				/* translators: Used between list items, there is a space after the comma. */
				__( ', ' ) // eslint-disable-line @wordpress/i18n-no-flanking-whitespace
			);
			switch ( key ) {
				case 'blocks': {
					return sprintf(
						// translators: %s: a list of block names separated by a comma.
						_n( '%s block.', '%s blocks.', changeValuesLength ),
						joinedChangesValue
					);
				}
				case 'elements': {
					return sprintf(
						// translators: %s: a list of element names separated by a comma.
						_n( '%s element.', '%s elements.', changeValuesLength ),
						joinedChangesValue
					);
				}
				case 'settings': {
					return sprintf(
						// translators: %s: a list of theme.json setting labels separated by a comma.
						__( '%s settings.' ),
						joinedChangesValue
					);
				}
				case 'styles': {
					return sprintf(
						// translators: %s: a list of theme.json top-level styles labels separated by a comma.
						__( '%s styles.' ),
						joinedChangesValue
					);
				}
				default: {
					return sprintf(
						// translators: %s: a list of global styles changes separated by a comma.
						__( '%s.' ),
						joinedChangesValue
					);
				}
			}
		} );
	}

	return EMPTY_ARRAY;
}
