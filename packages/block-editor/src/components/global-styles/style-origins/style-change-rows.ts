import { getValueFromObjectPath, isPlainObject } from '../../../utils/object';
import { getStyleLabel } from '../style-labels';

type StyleObject = Record< string, unknown >;

export interface StyleSource {
	layer: string;
}

export interface StyleChangeRow {
	key: string;
	path: string[];
	label: string;
	status: 'override' | 'local' | 'inherited';
	sourceLabel: string | null;
	value: unknown;
	inheritedValue?: unknown;
}

// Low to high precedence, mirroring the `resolveStyle` merge order.
const LAYER_ORDER = [ 'root', 'element', 'block', 'blockVariation' ];

// Preset attributes a block stores outside `style`, keyed to the style path
// they set and the preset type their slug belongs to.
const PRESET_ATTRIBUTES: Record< string, { path: string[]; type: string } > = {
	textColor: { path: [ 'color', 'text' ], type: 'color' },
	backgroundColor: { path: [ 'color', 'background' ], type: 'color' },
	gradient: { path: [ 'color', 'gradient' ], type: 'gradient' },
	fontSize: { path: [ 'typography', 'fontSize' ], type: 'font-size' },
	fontFamily: { path: [ 'typography', 'fontFamily' ], type: 'font-family' },
	borderColor: { path: [ 'border', 'color' ], type: 'color' },
	textShadow: { path: [ 'typography', 'textShadow' ], type: 'text-shadow' },
};

/**
 * Returns the style values a block sets on itself: its `style` attribute plus
 * the preset attributes stored beside it, as one style object. Preset slugs
 * are written in the `var:preset|type|slug` form so they format like any
 * other preset value.
 *
 * @param attributes Block attributes.
 * @return Local style values.
 */
export function getLocalStyle(
	attributes: Record< string, unknown > | null = {}
): StyleObject {
	const style: Record< string, StyleObject > = structuredClone(
		isPlainObject( attributes?.style ) ? attributes.style : {}
	) as Record< string, StyleObject >;
	for ( const [ attribute, { path, type } ] of Object.entries(
		PRESET_ATTRIBUTES
	) ) {
		const slug = attributes?.[ attribute ];
		if ( ! slug ) {
			continue;
		}
		const [ group, property ] = path;
		style[ group ] = {
			...style[ group ],
			[ property ]: `var:preset|${ type }|${ slug }`,
		};
	}
	return style;
}

/**
 * Whether a style value is set: not empty, and for an object, holding at
 * least one set value.
 *
 * @param value Style value.
 * @return Whether the value is set.
 */
function isSet( value: unknown ): boolean {
	if ( value === undefined || value === null || value === '' ) {
		return false;
	}
	if ( typeof value === 'object' && ! Array.isArray( value ) ) {
		return Object.values( value ).some( isSet );
	}
	return true;
}

/**
 * Finds the winning source for a style path. A composite value such as
 * padding can draw its sides from several layers; the highest precedence one
 * is the one a reset would fall back to first.
 *
 * @param sources Source map from `resolveStyle`, keyed by leaf path.
 * @param key     Style path joined with dots.
 * @return Winning source and the leaf it was read from.
 */
function getWinningSource(
	sources: Record< string, StyleSource > | undefined,
	key: string
): { source: StyleSource; leafKey: string } | null {
	let winner: { source: StyleSource; leafKey: string } | null = null;
	for ( const [ leafKey, source ] of Object.entries( sources ?? {} ) ) {
		if ( leafKey !== key && ! leafKey.startsWith( `${ key }.` ) ) {
			continue;
		}
		if (
			! winner ||
			LAYER_ORDER.indexOf( source.layer ) >
				LAYER_ORDER.indexOf( winner.source.layer )
		) {
			winner = { source, leafKey };
		}
	}
	return winner;
}

/**
 * CSS values that resolve to nothing a person can see or act on. A row whose
 * value is one of these says nothing, so it is left out.
 */
const NO_VALUE_KEYWORDS = [ 'inherit', 'none', 'transparent none' ];

/**
 * Whether a resolved value is worth a row: set, and not a keyword that only
 * hands the value on.
 *
 * @param value Style value.
 * @return Whether the value is real.
 */
function hasRealValue( value: unknown ): boolean {
	return (
		isSet( value ) &&
		! ( typeof value === 'string' && NO_VALUE_KEYWORDS.includes( value ) )
	);
}

// Style paths in the order of the inspector controls that set them. Paths not
// listed keep their place after these.
const INSPECTOR_ORDER = [
	'color.text',
	'typography.fontFamily',
	'typography.fontSize',
	'typography.fontStyle',
	'typography.fontWeight',
	'typography.lineHeight',
	'typography.letterSpacing',
	'typography.textDecoration',
	'typography.writingMode',
	'typography.textTransform',
	'color.background',
	'color.gradient',
	'background',
	'spacing.padding',
	'spacing.margin',
	'spacing.blockGap',
	'dimensions.minHeight',
	'border',
	'border.color',
	'border.width',
	'border.style',
	'border.radius',
	'shadow',
];

function getInspectorIndex( key: string ): number {
	const index = INSPECTOR_ORDER.indexOf( key );
	return index === -1 ? INSPECTOR_ORDER.length : index;
}

const BORDER_PARTS = [ 'width', 'style', 'color' ];

/**
 * Folds border width, style and colour rows into one Border row, as the
 * border control sets them together. Only rows that share a status and a
 * source fold, so no row's source is lost.
 *
 * @param rows Rows from one status group.
 * @return Rows with the border parts folded where they can be.
 */
function foldBorderRows( rows: StyleChangeRow[] ): StyleChangeRow[] {
	const parts = rows.filter( ( row ) =>
		BORDER_PARTS.some( ( part ) => row.key === `border.${ part }` )
	);
	if (
		parts.length < 2 ||
		parts.some(
			( row ) =>
				row.status !== parts[ 0 ].status ||
				row.sourceLabel !== parts[ 0 ].sourceLabel
		)
	) {
		return rows;
	}
	const collect = ( field: 'value' | 'inheritedValue' ) =>
		Object.fromEntries(
			parts.map( ( row ) => [ row.path[ 1 ], row[ field ] ] )
		);
	const border: StyleChangeRow = {
		...parts[ 0 ],
		key: 'border',
		path: [ 'border' ],
		label: getStyleLabel( [ 'border' ] ),
		value: collect( 'value' ),
		...( parts[ 0 ].status === 'override' && {
			inheritedValue: collect( 'inheritedValue' ),
		} ),
	};
	return [ ...rows.filter( ( row ) => ! parts.includes( row ) ), border ];
}

/**
 * Builds the style change rows for a block: every value it sets itself, and
 * every value it inherits from Global Styles.
 *
 * - `override`: set on the block over a real inherited value, carried as
 *   `inheritedValue`.
 * - `local`: set on the block with nothing real underneath. Always listed, so
 *   the list matches what a person changed even when nothing is replaced.
 * - `inherited`: from Global Styles only, and only with a real value.
 *
 * An inherited value whose source cannot be named is left out rather than
 * shown with a guessed source.
 *
 * @param args
 * @param args.paths          `{ path, isSupported }` entries to consider.
 * @param args.localStyle     Values the block sets, from `getLocalStyle`.
 * @param args.inheritedStyle Merged value from `resolveStyle`.
 * @param args.sources        Source map from `resolveStyle`.
 * @param args.describeSource Names a source for a path and the leaf it was read from.
 * @return Rows, local ones first, each group in inspector order.
 */
export function getStyleChangeRows( {
	paths,
	localStyle,
	inheritedStyle,
	sources,
	describeSource,
}: {
	paths: { path: string[]; isSupported: boolean }[];
	localStyle: StyleObject;
	inheritedStyle?: StyleObject;
	sources: Record< string, StyleSource >;
	describeSource: (
		source: StyleSource,
		context: { path: string[]; leafKey: string }
	) => string | null;
} ): StyleChangeRow[] {
	const rows: StyleChangeRow[] = [];
	for ( const { path, isSupported: supported } of paths ) {
		const key = path.join( '.' );
		const localValue = getValueFromObjectPath( localStyle, path );
		const isSetOnBlock = isSet( localValue );
		if ( ! isSetOnBlock && ! supported ) {
			continue;
		}
		const inheritedValue = getValueFromObjectPath( inheritedStyle, path );
		const winner = hasRealValue( inheritedValue )
			? getWinningSource( sources, key )
			: null;
		const sourceLabel = winner
			? describeSource( winner.source, { path, leafKey: winner.leafKey } )
			: null;
		if ( ! isSetOnBlock && ! sourceLabel ) {
			continue;
		}
		if ( ! isSetOnBlock ) {
			rows.push( {
				key,
				path,
				label: getStyleLabel( path ),
				status: 'inherited',
				sourceLabel,
				value: inheritedValue,
			} );
			continue;
		}
		rows.push( {
			key,
			path,
			label: getStyleLabel( path ),
			status: sourceLabel ? 'override' : 'local',
			sourceLabel,
			value: localValue,
			...( sourceLabel && { inheritedValue } ),
		} );
	}
	const ofStatus = ( status: StyleChangeRow[ 'status' ] ) =>
		foldBorderRows( rows.filter( ( row ) => row.status === status ) );
	const inInspectorOrder = ( list: StyleChangeRow[] ) =>
		list.sort(
			( a, b ) => getInspectorIndex( a.key ) - getInspectorIndex( b.key )
		);
	return [
		...inInspectorOrder( [
			...ofStatus( 'override' ),
			...ofStatus( 'local' ),
		] ),
		...inInspectorOrder( ofStatus( 'inherited' ) ),
	];
}

/**
 * Returns the style paths a reset of a row clears. A folded Border row stands
 * for its width, style and colour parts.
 *
 * @param row Row from `getStyleChangeRows`.
 * @return Style paths to clear.
 */
function getRowStylePaths( row: StyleChangeRow ): string[][] {
	return row.key === 'border'
		? BORDER_PARTS.map( ( part ) => [ 'border', part ] )
		: [ row.path ];
}

/**
 * Deletes the value at a path, then any parent the delete leaves empty.
 *
 * @param object Object to change in place.
 * @param path   Path of the value to delete.
 */
function unsetPath( object: unknown, path: string[] ) {
	const [ key, ...rest ] = path;
	if ( ! isPlainObject( object ) || ! ( key in object ) ) {
		return;
	}
	if ( rest.length ) {
		unsetPath( object[ key ], rest );
		const child = object[ key ];
		if ( ! isPlainObject( child ) || Object.keys( child ).length ) {
			return;
		}
	}
	delete object[ key ];
}

/**
 * Returns the attributes that reset the given rows on a block, so each style
 * falls back to the value it inherits. Paths outside the rows, such as
 * `style.css` and state styles, are kept.
 *
 * @param attributes Block attributes.
 * @param rows       Rows set on the block, from `getStyleChangeRows`.
 * @return Attributes to pass to `updateBlockAttributes`.
 */
export function getResetAttributes(
	attributes: Record< string, unknown > | null,
	rows: StyleChangeRow[]
): Record< string, unknown > {
	const style = structuredClone(
		isPlainObject( attributes?.style ) ? attributes.style : {}
	);
	const nextAttributes: Record< string, unknown > = {};
	for ( const row of rows ) {
		for ( const path of getRowStylePaths( row ) ) {
			unsetPath( style, path );
			for ( const [ attribute, preset ] of Object.entries(
				PRESET_ATTRIBUTES
			) ) {
				if ( preset.path.join( '.' ) === path.join( '.' ) ) {
					nextAttributes[ attribute ] = undefined;
				}
			}
		}
	}
	nextAttributes.style = Object.keys( style ).length ? style : undefined;
	return nextAttributes;
}
