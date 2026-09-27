import { Button, CustomSelectControl } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import FontAxisRangeControl from '../font-axis-range-control';
import {
	coveragePoints,
	coverageRange,
	resolveFontFaceCapabilities,
} from '../../utils/font-face-capabilities';
import {
	FONT_STRETCH_KEYWORDS,
	parseFontStretchValue,
} from '../../utils/parse-font-stretch';
import type { FontFamilyFace } from '../../utils/types';

type Option = {
	key: string;
	value?: string;
	name: string;
};

/*
 * The widths the property names. A preset is stored as the keyword rather than
 * as its percentage: a static family matches the face it names, a variable one
 * moves its `wdth` axis to the same coordinate, and the value stays readable.
 */
const FONT_WIDTHS: { name: string; value: string }[] = [
	{ name: _x( 'Ultra Condensed', 'font width' ), value: 'ultra-condensed' },
	{ name: _x( 'Extra Condensed', 'font width' ), value: 'extra-condensed' },
	{ name: _x( 'Condensed', 'font width' ), value: 'condensed' },
	{ name: _x( 'Semi Condensed', 'font width' ), value: 'semi-condensed' },
	{ name: _x( 'Normal', 'font width' ), value: 'normal' },
	{ name: _x( 'Semi Expanded', 'font width' ), value: 'semi-expanded' },
	{ name: _x( 'Expanded', 'font width' ), value: 'expanded' },
	{ name: _x( 'Extra Expanded', 'font width' ), value: 'extra-expanded' },
	{ name: _x( 'Ultra Expanded', 'font width' ), value: 'ultra-expanded' },
];

const DEFAULT_OPTION: Option = {
	key: 'default',
	value: undefined,
	name: __( 'Default' ),
};

type FontWidthControlProps = {
	value?: string;
	onChange: ( value?: string ) => void;
	fontFamilyFaces?: FontFamilyFace[];
};

/**
 * Picks the width a font is drawn at: one of a family's own condensed or
 * expanded faces, or a coordinate on a variable font's `wdth` axis.
 *
 * The value is written and the browser matches the nearest face it has. A
 * width the font does not have is not synthesised, unlike a weight or a slant,
 * so nothing here invents one.
 *
 * @param props                 Component props.
 * @param props.value           The current `font-stretch` value.
 * @param props.onChange        Called with the next value.
 * @param props.fontFamilyFaces The faces of the family in use, read for the
 *                              range a variable font declares.
 * @return The control.
 */
export default function FontWidthControl( {
	value,
	onChange,
	fontFamilyFaces,
}: FontWidthControlProps ) {
	const coverage = resolveFontFaceCapabilities( fontFamilyFaces ).width;
	const range = coverageRange( coverage );
	const width =
		value === undefined ? undefined : parseFontStretchValue( value );

	/*
	 * A variable face draws anything in its range, so the widths the property
	 * names inside that range are offered as a quick way there. A static family
	 * draws the widths its files have and nothing between them, so those are
	 * what it offers: naming the rest would promise widths no file can draw.
	 */
	const presets: Option[] = range
		? FONT_WIDTHS.filter(
				( preset ) =>
					FONT_STRETCH_KEYWORDS[ preset.value ] >= range.min &&
					FONT_STRETCH_KEYWORDS[ preset.value ] <= range.max
			).map( ( preset ) => ( {
				key: preset.value,
				value: preset.value,
				name: preset.name,
			} ) )
		: coveragePoints( coverage ).map( ( point ) => {
				const named = FONT_WIDTHS.find(
					( preset ) =>
						FONT_STRETCH_KEYWORDS[ preset.value ] === point
				);
				return named
					? { key: named.value, value: named.value, name: named.name }
					: {
							key: `${ point }%`,
							value: `${ point }%`,
							name: `${ point }%`,
						};
			} );

	const isPresetWidth =
		value === undefined ||
		presets.some( ( preset ) => preset.value === value );
	const [ isCustomWidth, setIsCustomWidth ] = useState( ! isPresetWidth );

	// A saved width that is not a preset stays visible and selected.
	const options: Option[] = [
		DEFAULT_OPTION,
		...( isPresetWidth
			? []
			: [
					{
						key: 'custom',
						value,
						name: sprintf(
							/* translators: %s: A font width, such as "113%". */
							__( 'Custom (%s)' ),
							value ?? ''
						),
					},
				] ),
		...presets,
	];

	const isOutsideRange =
		range !== undefined &&
		width !== undefined &&
		( width < range.min || width > range.max );

	const setWidth = ( next?: number ) =>
		onChange( next === undefined ? undefined : `${ next }%` );

	return (
		<Stack direction="column" gap="xs">
			<div className="block-editor-font-width-control__width">
				{ isCustomWidth ? (
					<FontAxisRangeControl
						label={ __( 'Width' ) }
						value={ width }
						min={ range ? range.min : 50 }
						max={ range ? range.max : 200 }
						initialPosition={
							range
								? Math.min(
										Math.max( 100, range.min ),
										range.max
									)
								: 100
						}
						onChange={ setWidth }
						className="block-editor-font-width-control__custom-width"
					/>
				) : (
					<CustomSelectControl
						label={ __( 'Width' ) }
						options={ options }
						value={
							options.find(
								( option ) => option.value === value
							) ?? DEFAULT_OPTION
						}
						onChange={ ( { selectedItem } ) =>
							onChange( selectedItem.value )
						}
					/>
				) }
				{ range && (
					<Button
						className="block-editor-font-width-control__width-toggle"
						label={
							isCustomWidth
								? __( 'Use width preset' )
								: __( 'Set custom width' )
						}
						icon={ settings }
						size="small"
						isPressed={ isCustomWidth }
						onClick={ () => setIsCustomWidth( ! isCustomWidth ) }
					/>
				) }
			</div>
			{ isOutsideRange && (
				<p className="block-editor-font-width-control__notice">
					{ sprintf(
						/* translators: 1: Saved font width. 2: Narrowest width the font supports. 3: Widest width the font supports. */
						__(
							'%1$s is outside this font’s width range (%2$s%%–%3$s%%). The font is drawn at the nearest width it has.'
						),
						value ?? '',
						String( range?.min ?? '' ),
						String( range?.max ?? '' )
					) }
				</p>
			) }
		</Stack>
	);
}
