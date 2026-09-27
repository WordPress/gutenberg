import { parseFontStretchValue } from './parse-font-stretch';
import { parseFontWeightValue } from './parse-font-weight';
import { getFontSlantRange, type FontSlantRange } from './get-font-slant-range';
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
	stretch: FontAxisCoverage[];
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

type Parser = ( value: string ) => number | undefined;

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
			( face ) => face.fontWeight,
			parseFontWeightValue
		),
		stretch: coverageOf(
			fontFamilyFaces,
			( face ) => face.fontStretch,
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
 * The values the faces draw, for an axis none of them interpolates.
 *
 * @param coverage What the faces cover on an axis.
 * @return The values, in order, or an empty list when a face interpolates.
 */
export function coveragePoints( coverage: FontAxisCoverage[] ): number[] {
	return isVariableCoverage( coverage )
		? []
		: coverage.map( ( { min } ) => min );
}

/**
 * The range a control can move over, for an axis a face interpolates.
 *
 * Only the intervals are spanned. A family can have both, a variable face and
 * a static one beside it, and a point outside the intervals is a value one file
 * draws rather than a place the range reaches: spanning to it would offer
 * everything in between, which nothing draws.
 *
 * @param coverage What the faces cover on an axis.
 * @return The range, or undefined when no face interpolates.
 */
export function coverageRange(
	coverage: FontAxisCoverage[]
): FontAxisCoverage | undefined {
	const intervals = coverage.filter( ( { min, max } ) => min < max );
	if ( ! intervals.length ) {
		return undefined;
	}
	return {
		min: Math.min( ...intervals.map( ( { min } ) => min ) ),
		max: Math.max( ...intervals.map( ( { max } ) => max ) ),
	};
}
