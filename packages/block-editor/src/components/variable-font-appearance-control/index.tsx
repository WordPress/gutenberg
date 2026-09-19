import {
	Button,
	CustomSelectControl,
	__experimentalNumberControl as NumberControl,
	RangeControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import { getFontStylesAndWeights } from '../../utils/get-font-styles-and-weights';
import { getFontWeightRange } from '../../utils/get-font-weight-range';
import type { FontFamilyFace } from '../../utils/types';

interface FontAppearanceValue {
	fontStyle?: string;
	fontWeight?: string | number;
}

interface VariableFontAppearanceControlProps {
	/** Current `fontStyle` and `fontWeight`. */
	value?: FontAppearanceValue;
	/** Called with the next `fontStyle` and `fontWeight`. */
	onChange: ( value: FontAppearanceValue ) => void;
	/** Faces of the selected font family. */
	fontFamilyFaces?: FontFamilyFace[];
	/** Whether font styles are enabled. */
	hasFontStyles?: boolean;
	/** Whether font weights are enabled. */
	hasFontWeights?: boolean;
}

interface Option {
	key: string;
	name: string;
	value?: string;
}

const DEFAULT_OPTION: Option = {
	key: 'default',
	name: __( 'Default' ),
	value: undefined,
};

// Used when no face declares a range.
const FULL_RANGE = { min: 1, max: 1000 };

/**
 * Style and weight controls for a variable font.
 *
 * The Appearance control offers fixed style and weight combinations, which
 * suits static faces. A variable font draws any weight in its range, so here
 * the style keeps the choices that Appearance offers, and the weight is
 * picked from the hundreds inside the range or, as with the font size, set
 * directly with a slider and a number field. Both controls write the same `fontStyle` and `fontWeight` values as
 * the Appearance control.
 *
 * A saved weight is shown as it is, even when it lies outside the font's
 * range; it only changes when the user sets another.
 *
 * @param props                 Component props.
 * @param props.value           Current `fontStyle` and `fontWeight`.
 * @param props.onChange        Called with the next `fontStyle` and `fontWeight`.
 * @param props.fontFamilyFaces Faces of the selected font family.
 * @param props.hasFontStyles   Whether font styles are enabled.
 * @param props.hasFontWeights  Whether font weights are enabled.
 */
export default function VariableFontAppearanceControl( {
	value = {},
	onChange,
	fontFamilyFaces,
	hasFontStyles = true,
	hasFontWeights = true,
}: VariableFontAppearanceControlProps ) {
	const { fontStyle, fontWeight } = value;
	const { fontStyles, fontWeights } =
		getFontStylesAndWeights( fontFamilyFaces );
	const range = getFontWeightRange( fontFamilyFaces ) ?? FULL_RANGE;

	const weightValue =
		fontWeight === undefined || fontWeight === null || fontWeight === ''
			? undefined
			: String( fontWeight );
	const numericWeight = Number( weightValue );
	const hasNumericWeight =
		weightValue !== undefined && ! Number.isNaN( numericWeight );
	const isOutsideRange =
		hasNumericWeight &&
		( numericWeight < range.min || numericWeight > range.max );

	// The same style choices as the Appearance control.
	const styleOptions: Option[] = [
		DEFAULT_OPTION,
		...fontStyles.map( ( style ) => ( {
			key: style.value ?? '',
			value: style.value,
			name: style.name ?? '',
		} ) ),
	];

	// The hundreds inside the range, named and numbered: "Light (300)".
	const weightPresets: Option[] = fontWeights.map( ( preset ) => ( {
		key: preset.value ?? '',
		value: preset.value,
		name: sprintf(
			/* translators: 1: Font weight name, such as "Bold". 2: Numeric font weight, such as "700". */
			_x( '%1$s (%2$s)', 'font weight' ),
			preset.name ?? '',
			preset.value ?? ''
		),
	} ) );
	const isPresetWeight =
		weightValue === undefined ||
		weightPresets.some( ( preset ) => preset.value === weightValue );
	const [ isCustomWeight, setIsCustomWeight ] = useState( ! isPresetWeight );

	// A saved weight that is not a preset stays visible and selected.
	const weightOptions: Option[] = [
		DEFAULT_OPTION,
		...( isPresetWeight
			? []
			: [
					{
						key: 'custom',
						value: weightValue,
						name: sprintf(
							/* translators: %s: Numeric font weight, such as "178". */
							__( 'Custom (%s)' ),
							weightValue ?? ''
						),
					},
				] ),
		...weightPresets,
	];

	const setWeight = ( nextWeight?: string | number ) =>
		onChange( {
			fontStyle,
			fontWeight:
				nextWeight === undefined || nextWeight === ''
					? undefined
					: String( nextWeight ),
		} );

	return (
		<Stack
			direction="column"
			gap="md"
			className="block-editor-variable-font-appearance-control"
		>
			{ hasFontStyles && (
				<CustomSelectControl
					label={ __( 'Style' ) }
					options={ styleOptions }
					value={
						styleOptions.find(
							( option ) => option.value === fontStyle
						) ?? DEFAULT_OPTION
					}
					onChange={ ( { selectedItem } ) =>
						onChange( {
							fontStyle: selectedItem.value,
							fontWeight,
						} )
					}
				/>
			) }
			{ hasFontWeights && (
				<Stack direction="column" gap="xs">
					<div className="block-editor-variable-font-appearance-control__weight">
						{ isCustomWeight ? (
							<Stack
								direction="row"
								gap="md"
								align="flex-end"
								className="block-editor-variable-font-appearance-control__custom-weight"
							>
								<RangeControl
									className="block-editor-variable-font-appearance-control__weight-slider"
									label={ __( 'Weight' ) }
									value={
										hasNumericWeight
											? numericWeight
											: undefined
									}
									initialPosition={ Math.min(
										Math.max( 400, range.min ),
										range.max
									) }
									min={ range.min }
									max={ range.max }
									step={ 1 }
									withInputField={ false }
									onChange={ ( next ) => setWeight( next ) }
								/>
								{ /*
								 * A separate number field, so a saved weight
								 * outside the range is shown as it is:
								 * RangeControl's own input clamps the value it
								 * displays.
								 */ }
								<NumberControl
									className="block-editor-variable-font-appearance-control__weight-number"
									label={ __( 'Weight' ) }
									hideLabelFromVision
									value={ weightValue ?? '' }
									min={ range.min }
									max={ range.max }
									step={ 1 }
									onChange={ ( next ) => setWeight( next ) }
								/>
							</Stack>
						) : (
							<CustomSelectControl
								label={ __( 'Weight' ) }
								options={ weightOptions }
								value={
									weightOptions.find(
										( option ) =>
											option.value === weightValue
									) ?? DEFAULT_OPTION
								}
								onChange={ ( { selectedItem } ) =>
									setWeight( selectedItem.value )
								}
							/>
						) }
						<Button
							className="block-editor-variable-font-appearance-control__weight-toggle"
							label={
								isCustomWeight
									? __( 'Use weight preset' )
									: __( 'Set custom weight' )
							}
							icon={ settings }
							size="small"
							isPressed={ isCustomWeight }
							onClick={ () =>
								setIsCustomWeight( ! isCustomWeight )
							}
						/>
					</div>
					{ isOutsideRange && (
						<p className="block-editor-variable-font-appearance-control__notice">
							{ sprintf(
								/* translators: 1: Saved font weight. 2: Lowest weight the font supports. 3: Highest weight the font supports. */
								__(
									'%1$s is outside this font’s weight range (%2$s–%3$s). It is kept until you choose another weight.'
								),
								weightValue ?? '',
								String( range.min ),
								String( range.max )
							) }
						</p>
					) }
				</Stack>
			) }
		</Stack>
	);
}
