/**
 * WordPress dependencies
 */
import {
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PresetInputControl from '../../preset-input-control';
import { useSettings } from '../../use-settings';
import { store as blockEditorStore } from '../../../store';
import { ALL_SIDES, LABELS } from '../utils';

export default function SpacingInputControl( {
	icon,
	isMixed = false,
	minimumCustomValue,
	onChange,
	onMouseOut,
	onMouseOver,
	showSideInLabel = true,
	side,
	spacingSizes,
	type,
	value,
} ) {
	const disableCustomSpacingSizes = useSelect( ( select ) => {
		const editorSettings = select( blockEditorStore ).getSettings();
		return editorSettings?.disableCustomSpacingSizes;
	} );

	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ 'px', 'em', 'rem' ],
	} );

	// Track selected unit state, initializing from current value's unit
	const [ selectedUnit, setSelectedUnit ] = useState(
		parseQuantityAndUnitFromRawValue( value )[ 1 ] || units[ 0 ]?.value
	);

	// Build aria label from side and type
	const sideLabel =
		ALL_SIDES.includes( side ) && showSideInLabel ? LABELS[ side ] : '';
	const typeLabel = showSideInLabel ? type?.toLowerCase() : type;

	const ariaLabel = sprintf(
		// translators: 1: The side of the block being modified (top, bottom, left etc.). 2. Type of spacing being modified (padding, margin, etc).
		_x( '%1$s %2$s', 'spacing' ),
		sideLabel,
		typeLabel
	).trim();

	return (
		<PresetInputControl
			allowNegativeOnDrag
			ariaLabel={ ariaLabel }
			className="spacing-sizes-control"
			disableCustomValues={ disableCustomSpacingSizes }
			icon={ icon }
			isMixed={ isMixed }
			minimumCustomValue={ minimumCustomValue }
			onChange={ onChange }
			onMouseOut={ onMouseOut }
			onMouseOver={ onMouseOver }
			onUnitChange={ setSelectedUnit }
			presets={ spacingSizes }
			presetType="spacing"
			selectedUnit={ selectedUnit }
			showTooltip={ false }
			units={ units }
			value={ value }
		/>
	);
}
