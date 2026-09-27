import {
	Button,
	CustomSelectControl,
	RangeControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import { getFontStretchRange } from '../../utils/get-font-stretch-range';
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
	const range = getFontStretchRange( fontFamilyFaces );
	const width =
		value === undefined ? undefined : parseFontStretchValue( value );

	// A variable font offers the widths its range covers; a static one offers
	// them all, since its faces are matched rather than interpolated.
	const presets: Option[] = FONT_WIDTHS.filter(
		( preset ) =>
			! range ||
			( FONT_STRETCH_KEYWORDS[ preset.value ] >= range.min &&
				FONT_STRETCH_KEYWORDS[ preset.value ] <= range.max )
	).map( ( preset ) => ( {
		key: preset.value,
		value: preset.value,
		name: preset.name,
	} ) );

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

	const setWidth = ( next?: string | number ) =>
		onChange(
			next === undefined || next === '' ? undefined : `${ next }%`
		);

	return (
		<Stack direction="column" gap="xs">
			<div className="block-editor-font-width-control__width">
				{ isCustomWidth ? (
					<Stack
						direction="row"
						gap="md"
						align="flex-end"
						className="block-editor-font-width-control__custom-width"
					>
						<RangeControl
							className="block-editor-font-width-control__width-slider"
							label={ __( 'Width' ) }
							value={ width }
							initialPosition={
								range
									? Math.min(
											Math.max( 100, range.min ),
											range.max
										)
									: 100
							}
							min={ range ? range.min : 50 }
							max={ range ? range.max : 200 }
							step={ 1 }
							withInputField={ false }
							onChange={ ( next?: number ) => setWidth( next ) }
						/>
						{ /*
						 * A separate number field, so a saved width outside
						 * the range is shown as it is: RangeControl's own input
						 * hides such a value rather than showing it. Typing
						 * stays inside the range the font declares, as the
						 * weight's field does.
						 */ }
						<NumberControl
							className="block-editor-font-width-control__width-input"
							label={ __( 'Width' ) }
							hideLabelFromVision
							value={ width }
							min={ range ? range.min : 0 }
							max={ range ? range.max : undefined }
							step={ 1 }
							onChange={ ( next?: string ) => setWidth( next ) }
						/>
					</Stack>
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
