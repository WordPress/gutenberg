import {
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalView as View,
	BaseControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSettings } from '../../components/use-settings';
import PresetInputControl from '../preset-input-control';
import useSpacingSizes from '../spacing-sizes-control/hooks/use-spacing-sizes';

/**
 * Control for line text indent.
 *
 * Renders the spacing presets as a slider or select list, with a toggle to
 * enter a custom value instead.
 *
 * @param {Object}                            props                   Component props.
 * @param {string}                            [props.value]           Currently selected text indent.
 * @param {(value: string|undefined) => void} props.onChange          Handles change in text indent selection.
 * @param {boolean}                           [props.hasBottomMargin] Whether to add bottom margin below the control.
 * @param {string}                            [props.help]            Help text to display below the control.
 * @param {string}                            [props.className]       Class name to add to the control.
 * @param {string}                            [props.placeholder]     Placeholder for the custom value input.
 *
 * @return {React.JSX.Element} Text indent control.
 */
export default function TextIndentControl( {
	value,
	onChange,
	hasBottomMargin = false,
	help,
	className,
	placeholder,
} ) {
	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [
			'px',
			'em',
			'rem',
			'ch',
			'%',
			'vw',
			'vh',
		],
		defaultValues: { px: 16, em: 2, rem: 2, ch: 2 },
	} );
	const spacingSizes = useSpacingSizes();

	// Track the selected unit so it is kept while the custom value is empty.
	const [ selectedUnit, setSelectedUnit ] = useState( () => {
		const [ , unit ] = parseQuantityAndUnitFromRawValue( value );
		return unit || units[ 0 ]?.value || 'px';
	} );

	return (
		<View style={ hasBottomMargin ? { marginBottom: 12 } : undefined }>
			<BaseControl.VisualLabel>
				{ __( 'Line indent' ) }
			</BaseControl.VisualLabel>
			<PresetInputControl
				ariaLabel={ __( 'Line indent' ) }
				className={ className }
				minimumCustomValue={ 0 }
				onChange={ onChange }
				onUnitChange={ setSelectedUnit }
				placeholder={ placeholder }
				presets={ spacingSizes }
				presetType="spacing"
				selectedUnit={ selectedUnit }
				units={ units }
				value={ value }
			/>
			{ help && (
				<p className="components-base-control__help">{ help }</p>
			) }
		</View>
	);
}
