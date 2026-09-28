import type { FontFamilyFace } from './types';

/**
 * The slant angles a face can be drawn at, in the degrees `font-style` uses.
 */
export interface FontSlantRange {
	min: number;
	max: number;
}

export type FontStyleDescriptor =
	| { kind: 'normal' }
	| { kind: 'italic' }
	| ( { kind: 'oblique' } & FontSlantRange );

/**
 * The angle `font-style: oblique` means when it is written without one.
 *
 * CSS Fonts 4: "The lack of an `<angle>` represents 14deg".
 */
export const DEFAULT_OBLIQUE_ANGLE = 14;

const OBLIQUE_ANGLES =
	/^oblique(?:\s+(-?\d*\.?\d+)deg)?(?:\s+(-?\d*\.?\d+)deg)?$/;

/**
 * Reads a `font-style` property or face descriptor, including an oblique
 * angle range. An omitted or invalid descriptor has the CSS initial value,
 * normal.
 *
 * @param value A font style or `@font-face` descriptor.
 * @return The normalized style.
 */
export function parseFontStyleDescriptor(
	value: unknown
): FontStyleDescriptor {
	if ( typeof value !== 'string' ) {
		return { kind: 'normal' };
	}
	const normalized = value.trim().toLowerCase().replace( /\s+/g, ' ' );
	if ( normalized === 'italic' ) {
		return { kind: 'italic' };
	}
	const angles = normalized.match( OBLIQUE_ANGLES );
	if ( ! angles ) {
		return { kind: 'normal' };
	}
	const start =
		angles[ 1 ] === undefined
			? DEFAULT_OBLIQUE_ANGLE
			: Number( angles[ 1 ] );
	const end = angles[ 2 ] === undefined ? start : Number( angles[ 2 ] );
	return {
		kind: 'oblique',
		min: Math.min( start, end ),
		max: Math.max( start, end ),
	};
}

/**
 * Returns the slant range a family's oblique faces declare.
 *
 * A face declares the angles it can be drawn at in `fontStyle`, such as
 * `"oblique 0deg 10deg"`. This reads that descriptor rather than a resolved
 * style: resolving picks one angle, and a control needs both ends.
 *
 * The angles are the ones CSS uses, which are the OpenType `slnt` axis with
 * its sign flipped, so a font whose axis runs -10 to 0 declares 0deg to 10deg.
 * A face written the other way round is taken as declared; nothing here
 * rewrites what a font said.
 *
 * @param fontFamilyFaces Font family faces from theme.json.
 * @return The range, or `undefined` when no face declares one.
 */
export function getFontSlantRange(
	fontFamilyFaces: FontFamilyFace[] | undefined
): FontSlantRange | undefined {
	let range: FontSlantRange | undefined;

	fontFamilyFaces?.forEach( ( { fontStyle } ) => {
		const style = parseFontStyleDescriptor( fontStyle );
		if ( style.kind !== 'oblique' ) {
			return;
		}
		const { min, max } = style;
		range = range
			? {
					min: Math.min( range.min, min ),
					max: Math.max( range.max, max ),
				}
			: { min, max };
	} );

	return range;
}

/**
 * The angle to start an oblique at: the one CSS means by a bare `oblique`,
 * kept inside what the face can draw.
 *
 * @param range The range the face declares.
 * @return The angle, in degrees.
 */
export function getDefaultObliqueAngle( range: FontSlantRange ): number {
	return Math.min( Math.max( DEFAULT_OBLIQUE_ANGLE, range.min ), range.max );
}
