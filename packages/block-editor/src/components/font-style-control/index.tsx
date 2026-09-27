import { CustomSelectControl } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import FontAxisRangeControl from '../font-axis-range-control';
import {
	DEFAULT_OBLIQUE_ANGLE,
	getDefaultObliqueAngle,
	getFontSlantRange,
	type FontSlantRange,
} from '../../utils/get-font-slant-range';
import type { FontFamilyFace } from '../../utils/types';

type Option = {
	key: string;
	value?: string;
	name: string;
};

const DEFAULT_OPTION: Option = {
	key: 'default',
	value: undefined,
	name: __( 'Default' ),
};

const OBLIQUE = /^oblique(?:\s+(-?\d*\.?\d+)deg)?$/;

/**
 * Whether a family has a face drawn italic, which is a design of its own
 * rather than a slant applied to the upright one.
 *
 * @param fontFamilyFaces The faces of the family in use.
 * @return Whether italic is one of the faces.
 */
function hasItalicFace( fontFamilyFaces?: FontFamilyFace[] ): boolean {
	return !! fontFamilyFaces?.some(
		( { fontStyle } ) => fontStyle?.trim().toLowerCase() === 'italic'
	);
}

/**
 * Whether anything is known about the styles the family is drawn in.
 *
 * A family with no faces has not said it has no italic; it has said nothing. A
 * system font has no faces to read, and a theme may register a family without
 * them, so this is the ordinary case rather than an edge one.
 *
 * @param fontFamilyFaces The faces of the family in use.
 * @return Whether there is a declaration to read.
 */
function hasDeclaredFaces( fontFamilyFaces?: FontFamilyFace[] ): boolean {
	return !! fontFamilyFaces?.length;
}

/**
 * Reads the angle out of a saved oblique, or the angle a bare one means.
 *
 * @param value The saved `font-style`.
 * @param range The range the face declares.
 * @return The angle, or undefined when the value is not oblique.
 */
function getAngle(
	value: string | undefined,
	range: FontSlantRange | undefined
): number | undefined {
	const angles = value
		?.trim()
		.toLowerCase()
		.replace( /\s+/g, ' ' )
		.match( OBLIQUE );
	if ( ! angles ) {
		return undefined;
	}
	if ( angles[ 1 ] !== undefined ) {
		return Number( angles[ 1 ] );
	}
	// A bare `oblique` is the angle the property means by it, which the face
	// may not reach.
	return range ? getDefaultObliqueAngle( range ) : DEFAULT_OBLIQUE_ANGLE;
}

type FontStyleControlProps = {
	value?: string;
	onChange: ( value?: string ) => void;
	fontFamilyFaces?: FontFamilyFace[];
};

/**
 * Picks the style a font is drawn in, from the styles it actually has.
 *
 * Nothing synthesised is offered here, as long as the font has said what it
 * has. A browser will slant an upright face when asked for an italic it does
 * not have, but that is a fallback rather than one of the font's styles, and
 * naming it in a list of what the font offers would be untrue. The toolbar's
 * italic still asks for it.
 *
 * A family that declares no faces is the exception, and it is the common case:
 * a system font has none to read, and a theme need not write them. Nothing is
 * known there, so Italic stays, as it did before this list was built from the
 * faces.
 *
 * @param props                 Component props.
 * @param props.value           The current `font-style` value.
 * @param props.onChange        Called with the next value.
 * @param props.fontFamilyFaces The faces of the family in use.
 * @return The control.
 */
export default function FontStyleControl( {
	value,
	onChange,
	fontFamilyFaces,
}: FontStyleControlProps ) {
	const slantRange = getFontSlantRange( fontFamilyFaces );
	const angle = getAngle( value, slantRange );
	const isOblique = angle !== undefined;

	/*
	 * Italic is offered for a family that has an italic face, and for one whose
	 * faces are not described at all, where leaving it out would take a style
	 * away on the word of a font that never spoke. What this control does not do
	 * is offer an italic to a family whose faces are listed and include none.
	 */
	const offersItalic =
		hasItalicFace( fontFamilyFaces ) ||
		! hasDeclaredFaces( fontFamilyFaces );

	const options: Option[] = [
		DEFAULT_OPTION,
		{ key: 'normal', value: 'normal', name: __( 'Normal' ) },
		...( offersItalic
			? [ { key: 'italic', value: 'italic', name: __( 'Italic' ) } ]
			: [] ),
		...( slantRange
			? [ { key: 'oblique', value: 'oblique', name: __( 'Oblique' ) } ]
			: [] ),
	];

	// An oblique is selected whatever angle it carries.
	const selected = isOblique
		? options.find( ( option ) => option.key === 'oblique' )
		: options.find( ( option ) => option.value === value );

	const setAngle = ( next?: number ) =>
		onChange( next === undefined ? 'oblique' : `oblique ${ next }deg` );

	const chooseStyle = ( nextKey: string ) => {
		if ( nextKey === 'default' ) {
			onChange( undefined );
			return;
		}
		if ( nextKey !== 'oblique' ) {
			onChange( nextKey );
			return;
		}
		/*
		 * Starting an oblique: leave the angle out when the face can draw the
		 * one the property means by a bare `oblique`, so the value keeps that
		 * meaning and follows another font that reads it differently. When the
		 * face stops short of it, say the angle, or the value would ask for a
		 * slant the axis does not reach.
		 */
		if (
			slantRange &&
			getDefaultObliqueAngle( slantRange ) !== DEFAULT_OBLIQUE_ANGLE
		) {
			onChange( `oblique ${ getDefaultObliqueAngle( slantRange ) }deg` );
			return;
		}
		onChange( 'oblique' );
	};

	return (
		<Stack direction="column" gap="md">
			<CustomSelectControl
				label={ __( 'Style' ) }
				options={ options }
				value={ selected ?? DEFAULT_OPTION }
				onChange={ ( { selectedItem } ) =>
					chooseStyle( selectedItem.key )
				}
			/>
			{ isOblique && slantRange && (
				<FontAxisRangeControl
					label={ __( 'Slant' ) }
					value={ angle }
					min={ slantRange.min }
					max={ slantRange.max }
					onChange={ setAngle }
					outOfRangeNotice={
						angle! < slantRange.min || angle! > slantRange.max
							? sprintf(
									/* translators: 1: Saved slant angle. 2: Smallest angle the font supports. 3: Largest angle the font supports. */
									__(
										'%1$s° is outside this font’s oblique range (%2$s°–%3$s°). The browser may synthesize the style rather than use the font’s own slant.'
									),
									String( angle ),
									String( slantRange.min ),
									String( slantRange.max )
								)
							: undefined
					}
				/>
			) }
		</Stack>
	);
}
