/**
 * External dependencies
 */
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { getBlockTypes } from '@wordpress/blocks';

type TranslationMap = Record< string, string >;
type BlockNamesMap = Record< string, string >;

export interface GlobalStylesChangeItem {
	label: string;
	states: string[];
}

export interface GlobalStylesChangeGroup {
	group: string;
	items: GlobalStylesChangeItem[];
}

interface GetGlobalStylesChangesOptions {
	maxResults?: number;
}

type ChangeEntry = {
	group: string;
	label: string;
	stateKeys: string[];
};

const globalStylesChangesCache = new Map< string, ChangeEntry[] >();
const EMPTY_STRING_ARRAY: string[] = [];
const EMPTY_GROUP_ARRAY: GlobalStylesChangeGroup[] = [];
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
const styleStateLabelMap: TranslationMap = {
	'@tablet': __( 'Tablet' ),
	'@mobile': __( 'Mobile' ),
	':link': __( 'Link' ),
	':any-link': __( 'Any Link' ),
	':visited': __( 'Visited' ),
	':hover': __( 'Hover' ),
	':focus': __( 'Focus' ),
	':focus-visible': __( 'Focus-visible' ),
	':active': __( 'Active' ),
};
const styleStateOrder = Object.keys( styleStateLabelMap );

/**
 * Whether a theme.json key represents a style state (viewport or pseudo).
 *
 * @param key Object key from a styles path.
 */
function isStyleStateKey( key: string ): boolean {
	return key.startsWith( '@' ) || key.startsWith( ':' );
}

/**
 * Summarize a deep change path for change listing.
 * Keeps the group + name (two segments), plus any consecutive style-state keys
 * so viewport/pseudo edits are distinguishable from default-state edits.
 *
 * @param parentPath Dot-separated path to the changed value.
 */
function getChangeKeyPath( parentPath: string ): string {
	const keyArray = parentPath.split( '.' );
	const changeKeyParts = keyArray.slice( 0, 2 );

	for ( let i = 2; i < keyArray.length; i++ ) {
		const key = keyArray[ i ];
		if ( ! key || ! isStyleStateKey( key ) ) {
			break;
		}
		changeKeyParts.push( key );
	}

	return changeKeyParts.join( '.' );
}

/**
 * Sort style-state keys into a stable viewport-then-pseudo order.
 *
 * @param stateKeys Viewport and/or pseudo keys.
 */
function sortStyleStateKeys( stateKeys: string[] ): string[] {
	return [ ...new Set( stateKeys ) ].sort( ( a, b ) => {
		const aIndex = styleStateOrder.indexOf( a );
		const bIndex = styleStateOrder.indexOf( b );
		const normalizedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
		const normalizedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
		if ( normalizedA !== normalizedB ) {
			return normalizedA - normalizedB;
		}
		return a.localeCompare( b );
	} );
}

/**
 * Translate style-state keys to labels.
 *
 * @param stateKeys Viewport and/or pseudo keys.
 */
function getStyleStateLabels( stateKeys: string[] ): string[] {
	return sortStyleStateKeys( stateKeys ).map(
		( key ) => styleStateLabelMap[ key ] || key.replace( /^[@:]/, '' )
	);
}

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
 * Get the base (state-free) translation for a given global styles key.
 *
 * @param key A key representing a path to a global style property or setting.
 * @return A translated label or undefined if no translation exists.
 */
function getBaseLabel( key: string ): string | undefined {
	const keyArray = key.split( '.' );
	const twoPartKey = keyArray.slice( 0, 2 ).join( '.' );

	if ( translationMap[ key ] ) {
		return translationMap[ key ];
	}

	if ( translationMap[ twoPartKey ] ) {
		return translationMap[ twoPartKey ];
	}

	if ( keyArray?.[ 0 ] === 'blocks' ) {
		return getBlockNames()?.[ keyArray[ 1 ] ] || keyArray[ 1 ];
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
		 * Keep the group + name (two levels), plus any style-state keys
		 * (viewport/pseudo) so the save panel can label Mobile/Tablet/etc.
		 */
		return changedObject !== originalObject
			? getChangeKeyPath( parentPath )
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
 * Returns summarized global styles changes with style-state keys.
 * Results are cached using a Map() key of `JSON.stringify( { next, previous } )`.
 * Same block/element appears once; state keys from all its changes are merged.
 *
 * @param next     The changed object to compare.
 * @param previous The original object to compare against.
 * @return Change entries grouped by label with merged state keys.
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

	const itemsByKey = new Map< string, ChangeEntry >();

	for ( const path of new Set( changedValueArray ) ) {
		const label = getBaseLabel( path );
		if ( ! label ) {
			continue;
		}

		const group = path.split( '.' )[ 0 ];
		const itemKey = `${ group }\0${ label }`;
		const stateKeys = path.split( '.' ).slice( 2 ).filter( isStyleStateKey );
		const existing = itemsByKey.get( itemKey );

		if ( existing ) {
			existing.stateKeys = sortStyleStateKeys( [
				...existing.stateKeys,
				...stateKeys,
			] );
			continue;
		}

		itemsByKey.set( itemKey, {
			group,
			label,
			stateKeys: sortStyleStateKeys( stateKeys ),
		} );
	}

	const result = [ ...itemsByKey.values() ];
	globalStylesChangesCache.set( cacheKey, result );

	return result;
}

/**
 * Returns global styles changes as grouped items with state labels.
 * Useful for UIs that render viewport/pseudo badges beside a single name.
 *
 * @param next     The changed object to compare.
 * @param previous The original object to compare against.
 * @param options  Options. maxResults: results to return before truncating.
 * @return Grouped change items.
 */
export function getGlobalStylesChangeGroups(
	next: any,
	previous: any,
	options: GetGlobalStylesChangesOptions = {}
): GlobalStylesChangeGroup[] {
	let changeList = getGlobalStylesChangelist( next, previous );
	const { maxResults } = options;

	if ( ! changeList.length ) {
		return EMPTY_GROUP_ARRAY;
	}

	if ( !! maxResults && changeList.length > maxResults ) {
		changeList = changeList.slice( 0, maxResults );
	}

	const groups: GlobalStylesChangeGroup[] = [];
	const groupIndexByName = new Map< string, number >();

	for ( const entry of changeList ) {
		const item: GlobalStylesChangeItem = {
			label: entry.label,
			states: getStyleStateLabels( entry.stateKeys ),
		};
		const existingIndex = groupIndexByName.get( entry.group );

		if ( existingIndex === undefined ) {
			groupIndexByName.set( entry.group, groups.length );
			groups.push( {
				group: entry.group,
				items: [ item ],
			} );
			continue;
		}

		groups[ existingIndex ]!.items.push( item );
	}

	return groups;
}

/**
 * Format a change item label, optionally including states for plain-text UIs.
 *
 * @param item Change item with label and state labels.
 */
function formatChangeItemLabel( item: GlobalStylesChangeItem ): string {
	if ( ! item.states.length ) {
		return item.label;
	}

	return sprintf(
		/* translators: 1: block or element name. 2: comma-separated style states such as Mobile, Tablet. */
		__( '%1$s (%2$s)' ),
		item.label,
		item.states.join(
			/* translators: Used between list items, there is a space after the comma. */
			__( ', ' ) // eslint-disable-line @wordpress/i18n-no-flanking-whitespace
		)
	);
}

/**
 * From a getGlobalStylesChangelist() result, returns an array of translated global styles changes, grouped by type.
 * The types are 'blocks', 'elements', 'settings', and 'styles'.
 * Each block/element is listed once; non-default states are appended in parentheses for plain text.
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
	const groups = getGlobalStylesChangeGroups( next, previous, options );

	if ( ! groups.length ) {
		return EMPTY_STRING_ARRAY;
	}

	return groups.map( ( { group, items } ) => {
		const changeValues = items.map( formatChangeItemLabel );
		const changeValuesLength = changeValues.length;
		const joinedChangesValue = changeValues.join(
			/* translators: Used between list items, there is a space after the comma. */
			__( ', ' ) // eslint-disable-line @wordpress/i18n-no-flanking-whitespace
		);

		switch ( group ) {
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
