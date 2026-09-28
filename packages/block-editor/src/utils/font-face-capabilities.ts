import { parseFontStretchValue } from './parse-font-stretch';
import { parseFontWeightValue } from './parse-font-weight';
import {
	getFontSlantRange,
	parseFontStyleDescriptor,
	type FontSlantRange,
	type FontStyleDescriptor,
} from './get-font-slant-range';
import type { FontFamilyFace } from './types';

/**
 * What a family's faces cover on one numeric axis.
 *
 * A face declaring a single value covers a point, where `min` and `max` are the
 * same: a static file draws that value and nothing near it. A face declaring a
 * range covers an interval. Keeping both in one list means the static case is
 * not flattened into a span that claims values no file can draw: a family with
 * a 400 and a 700 covers two points, not 400 to 700.
 */
export interface FontAxisCoverage {
	min: number;
	max: number;
}

export interface FontFaceCapabilities {
	weight: FontAxisCoverage[];
	width: FontAxisCoverage[];
	/**
	 * Style is not a number, so it is not coverage. A face is upright, italic,
	 * or oblique over a range of angles, and the three are a choice rather than
	 * points on one scale.
	 */
	style: {
		normal: boolean;
		italic: boolean;
		oblique?: FontSlantRange;
	};
}

export interface FontAppearance {
	fontStyle?: unknown;
	fontWeight?: unknown;
	fontStretch?: unknown;
}

const DEFAULT_FONT_WEIGHT_VALUES = [
	'100',
	'200',
	'300',
	'400',
	'500',
	'600',
	'700',
	'800',
	'900',
	'1000',
];

type Parser = ( value: string ) => number | undefined;

function descriptorRange(
	value: string | number | undefined,
	fallback: string,
	parse: Parser
): FontAxisCoverage {
	const parts = String( value ?? fallback )
		.trim()
		.split( /\s+/ );
	const parsed = parts.map( parse );
	if ( parts.length > 2 || parsed.some( ( end ) => end === undefined ) ) {
		const defaultValue = parse( fallback ) ?? 0;
		return { min: defaultValue, max: defaultValue };
	}
	const ends = parsed as number[];
	const first = ends[ 0 ] ?? parse( fallback ) ?? 0;
	const second = ends[ 1 ] ?? first;
	return {
		min: Math.min( first, second ),
		max: Math.max( first, second ),
	};
}

function contains( { min, max }: FontAxisCoverage, value: number ): boolean {
	return value >= min && value <= max;
}

/**
 * Whether any face can draw a value on an axis.
 *
 * @param coverage What the faces cover on an axis.
 * @param value    The coordinate to test.
 * @return Whether the coordinate is covered.
 */
export function isValueCovered(
	coverage: FontAxisCoverage[],
	value: number
): boolean {
	return coverage.some( ( range ) => contains( range, value ) );
}

function selectRangeValue(
	ranges: FontAxisCoverage[],
	desired: number,
	preferLower: boolean
): number {
	const values = [
		...new Set( ranges.flatMap( ( { min, max } ) => [ min, max ] ) ),
	];
	const lower = values
		.filter( ( value ) => value < desired )
		.sort( ( a, b ) => b - a );
	const higher = values
		.filter( ( value ) => value > desired )
		.sort( ( a, b ) => a - b );
	return (
		preferLower ? [ ...lower, ...higher ] : [ ...higher, ...lower ]
	)[ 0 ];
}

function selectByRange< T extends FontFamilyFace >(
	faces: T[],
	read: ( face: T ) => FontAxisCoverage,
	desired: number,
	preferLower: boolean
): T[] {
	const exact = faces.filter( ( face ) => contains( read( face ), desired ) );
	if ( exact.length ) {
		return exact;
	}
	const selected = selectRangeValue(
		faces.map( read ),
		desired,
		preferLower
	);
	return faces.filter( ( face ) => contains( read( face ), selected ) );
}

function selectByWeight< T extends FontFamilyFace >(
	faces: T[],
	desired: number
): T[] {
	const read = ( face: T ) =>
		descriptorRange( face.fontWeight, 'normal', parseFontWeightValue );
	const exact = faces.filter( ( face ) => contains( read( face ), desired ) );
	if ( exact.length ) {
		return exact;
	}
	const values = [
		...new Set(
			faces.flatMap( ( face ) => Object.values( read( face ) ) )
		),
	];
	const ascending = ( candidates: number[] ) =>
		candidates.sort( ( a, b ) => a - b );
	const descending = ( candidates: number[] ) =>
		candidates.sort( ( a, b ) => b - a );
	let ordered: number[];
	if ( desired >= 400 && desired <= 500 ) {
		ordered = [
			...ascending(
				values.filter( ( value ) => value >= desired && value <= 500 )
			),
			...descending( values.filter( ( value ) => value < desired ) ),
			...ascending( values.filter( ( value ) => value > 500 ) ),
		];
	} else if ( desired < 400 ) {
		ordered = [
			...descending( values.filter( ( value ) => value < desired ) ),
			...ascending( values.filter( ( value ) => value > desired ) ),
		];
	} else {
		ordered = [
			...ascending( values.filter( ( value ) => value > desired ) ),
			...descending( values.filter( ( value ) => value < desired ) ),
		];
	}
	return faces.filter( ( face ) => contains( read( face ), ordered[ 0 ] ) );
}

function prefersLowerOblique( angle: number ): boolean {
	if ( angle >= 11 ) {
		return false;
	}
	if ( angle >= 0 ) {
		return true;
	}
	return angle <= -11;
}

function selectByStyle< T extends FontFamilyFace >(
	faces: T[],
	requested: FontStyleDescriptor
): T[] {
	const described = faces.map( ( face ) => ( {
		face,
		style: parseFontStyleDescriptor( face.fontStyle ),
	} ) );
	const sameKind = described.filter(
		( { style } ) => style.kind === requested.kind
	);
	const oblique = sameKind as Array< {
		face: T;
		style: Extract< FontStyleDescriptor, { kind: 'oblique' } >;
	} >;
	const allOblique = described.filter(
		(
			item
		): item is {
			face: T;
			style: Extract< FontStyleDescriptor, { kind: 'oblique' } >;
		} => item.style.kind === 'oblique'
	);
	const selectOblique = (
		candidates: typeof allOblique,
		desired: number,
		preferLower: boolean
	) => {
		const exact = candidates.filter( ( { style } ) =>
			contains( style, desired )
		);
		if ( exact.length ) {
			return exact.map( ( { face } ) => face );
		}
		const selected = selectRangeValue(
			candidates.map( ( { style } ) => style ),
			desired,
			preferLower
		);
		return candidates
			.filter( ( { style } ) => contains( style, selected ) )
			.map( ( { face } ) => face );
	};

	if ( requested.kind === 'normal' ) {
		if ( sameKind.length ) {
			return sameKind.map( ( { face } ) => face );
		}
		const nonNegative = allOblique.filter(
			( { style } ) => style.max >= 0
		);
		if ( nonNegative.length ) {
			return selectOblique( nonNegative, 0, false );
		}
		const italic = described.filter(
			( { style } ) => style.kind === 'italic'
		);
		if ( italic.length ) {
			return italic.map( ( { face } ) => face );
		}
		if ( allOblique.length ) {
			return selectOblique( allOblique, 0, true );
		}
		return faces.slice( 0, 1 );
	}

	if ( requested.kind === 'italic' ) {
		if ( sameKind.length ) {
			return sameKind.map( ( { face } ) => face );
		}
		const positive = allOblique.filter( ( { style } ) => style.max > 0 );
		if ( positive.length ) {
			return selectOblique( positive, 11, false );
		}
		const normal = described.filter(
			( { style } ) => style.kind === 'normal'
		);
		if ( normal.length ) {
			return normal.map( ( { face } ) => face );
		}
		if ( allOblique.length ) {
			return selectOblique( allOblique, 0, true );
		}
		return faces.slice( 0, 1 );
	}

	const angle = requested.min;
	const exact = oblique.filter( ( { style } ) => contains( style, angle ) );
	if ( exact.length ) {
		return exact.map( ( { face } ) => face );
	}
	const sameDirection = oblique.filter( ( { style } ) =>
		angle >= 0 ? style.max >= 0 : style.min <= 0
	);
	if ( sameDirection.length ) {
		return selectOblique(
			sameDirection,
			angle,
			prefersLowerOblique( angle )
		);
	}
	const fallbackKinds =
		angle >= 0 ? [ 'italic', 'normal' ] : [ 'normal', 'italic' ];
	for ( const kind of fallbackKinds ) {
		const fallback = described.filter(
			( { style } ) => style.kind === kind
		);
		if ( fallback.length ) {
			return fallback.map( ( { face } ) => face );
		}
	}
	return faces.slice( 0, 1 );
}

/**
 * Selects the faces CSS may use for an appearance, in the same property order
 * as the font matching algorithm: width, style, then weight.
 *
 * Several faces can remain when they have the same descriptors, for example
 * where unicode ranges or sources split one appearance. Consumers may then
 * intersect metadata that must be available whichever of those faces renders.
 *
 * @param faces      The family's faces.
 * @param appearance The CSS appearance in use.
 * @return The closest matching faces.
 */
export function getMatchingFontFaces< T extends FontFamilyFace >(
	faces: T[],
	appearance: FontAppearance = {}
): T[] {
	if ( ! faces.length ) {
		return [];
	}
	const width =
		typeof appearance.fontStretch === 'string'
			? ( parseFontStretchValue( appearance.fontStretch ) ?? 100 )
			: 100;
	let matching = selectByRange(
		faces,
		( face ) =>
			descriptorRange(
				face.fontStretch,
				'normal',
				parseFontStretchValue
			),
		width,
		width <= 100
	);

	matching = selectByStyle(
		matching,
		parseFontStyleDescriptor( appearance.fontStyle )
	);

	const weight =
		parseFontWeightValue( String( appearance.fontWeight ?? 400 ) ) ?? 400;
	matching = selectByWeight( matching, weight );

	return matching;
}

function coverageOf(
	fontFamilyFaces: FontFamilyFace[] | undefined,
	read: ( face: FontFamilyFace ) => string | number | undefined,
	parse: Parser
): FontAxisCoverage[] {
	const coverage: FontAxisCoverage[] = [];

	fontFamilyFaces?.forEach( ( face ) => {
		const declared = read( face );
		if ( declared === undefined ) {
			return;
		}
		const parts = String( declared ).trim().split( /\s+/ );
		const ends = parts.map( parse );
		if ( ends.some( ( end ) => end === undefined ) ) {
			return;
		}
		const values = ends as number[];
		const min = Math.min( ...values );
		const max = Math.max( ...values );
		if (
			! coverage.some(
				( existing ) => existing.min === min && existing.max === max
			)
		) {
			coverage.push( { min, max } );
		}
	} );

	return coverage.sort( ( a, b ) => a.min - b.min );
}

/**
 * Reads what a family's faces can draw, from the descriptors they declare.
 *
 * One reader for all of them, because they are one question asked of one list:
 * reading the same faces in several places is how a control ends up offering
 * what another part of the panel has already ruled out.
 *
 * @param fontFamilyFaces Font family faces from theme.json.
 * @return What the faces cover.
 */
export function resolveFontFaceCapabilities(
	fontFamilyFaces: FontFamilyFace[] | undefined
): FontFaceCapabilities {
	return {
		weight: coverageOf(
			fontFamilyFaces,
			// @font-face defaults an omitted descriptor to `normal` (400).
			( face ) => face.fontWeight ?? 'normal',
			parseFontWeightValue
		),
		width: coverageOf(
			fontFamilyFaces,
			// @font-face defaults an omitted descriptor to `normal` (100%).
			( face ) => face.fontStretch ?? 'normal',
			parseFontStretchValue
		),
		style: {
			// A face that says nothing about its style is upright.
			normal: !! fontFamilyFaces?.some(
				( { fontStyle } ) =>
					fontStyle === undefined ||
					fontStyle.trim().toLowerCase() === 'normal'
			),
			italic: !! fontFamilyFaces?.some(
				( { fontStyle } ) =>
					fontStyle?.trim().toLowerCase() === 'italic'
			),
			oblique: getFontSlantRange( fontFamilyFaces ),
		},
	};
}

/**
 * Whether any face interpolates, rather than each drawing one value.
 *
 * @param coverage What the faces cover on an axis.
 * @return Whether a value between the declared ones can be drawn.
 */
export function isVariableCoverage( coverage: FontAxisCoverage[] ): boolean {
	return coverage.some( ( { min, max } ) => min < max );
}

/**
 * The point values the faces draw beside any interpolating intervals.
 *
 * @param coverage What the faces cover on an axis.
 * @return The static values, in order.
 */
export function coveragePoints( coverage: FontAxisCoverage[] ): number[] {
	return coverage
		.filter( ( { min, max } ) => min === max )
		.map( ( { min } ) => min );
}

/**
 * The continuous range a control can move over, for an axis a face
 * interpolates.
 *
 * Only connected intervals are spanned. A family can have a variable face and
 * a static one beside it, or separate variable intervals. Neither may make a
 * control offer the gap between values that different files draw.
 *
 * @param coverage What the faces cover on an axis.
 * @return The range, or undefined when no face interpolates.
 */
export function coverageRange(
	coverage: FontAxisCoverage[]
): FontAxisCoverage | undefined {
	const intervals = coverage
		.filter( ( { min, max } ) => min < max )
		.sort( ( a, b ) => a.min - b.min );
	if ( ! intervals.length ) {
		return undefined;
	}
	const range = { ...intervals[ 0 ] };
	for ( const interval of intervals.slice( 1 ) ) {
		if ( interval.min > range.max ) {
			return undefined;
		}
		range.max = Math.max( range.max, interval.max );
	}
	return range;
}

/**
 * Returns the named weight values a control can offer for a family.
 *
 * A family without face metadata remains unknown, so it retains the ordinary
 * CSS weights. Once faces are declared, the list is only their static points
 * and the hundreds a variable interval can actually draw.
 *
 * @param fontFamilyFaces Font family faces from theme.json.
 * @return Weight values in ascending order.
 */
export function getFontWeightValues(
	fontFamilyFaces: FontFamilyFace[] | undefined
): string[] {
	if ( ! fontFamilyFaces?.length ) {
		return DEFAULT_FONT_WEIGHT_VALUES;
	}

	const { weight } = resolveFontFaceCapabilities( fontFamilyFaces );
	const values = new Set( coveragePoints( weight ).map( String ) );

	weight.forEach( ( { min, max } ) => {
		if ( min === max ) {
			return;
		}
		for (
			let value = Math.ceil( min / 100 ) * 100;
			value <= max;
			value += 100
		) {
			values.add( String( value ) );
		}
	} );

	return [ ...values ].sort( ( a, b ) => Number( a ) - Number( b ) );
}

/**
 * Returns the styles a control can offer for a family.
 *
 * An absent face list says nothing about a family, so it keeps the ordinary
 * normal and italic choices. A declared list is capability-only.
 *
 * @param fontFamilyFaces Font family faces from theme.json.
 * @return CSS font-style values.
 */
export function getFontStyleValues(
	fontFamilyFaces: FontFamilyFace[] | undefined
): string[] {
	if ( ! fontFamilyFaces?.length ) {
		return [ 'normal', 'italic' ];
	}

	const { style } = resolveFontFaceCapabilities( fontFamilyFaces );
	return [
		...( style.normal ? [ 'normal' ] : [] ),
		...( style.italic ? [ 'italic' ] : [] ),
		...( style.oblique ? [ 'oblique' ] : [] ),
	];
}
