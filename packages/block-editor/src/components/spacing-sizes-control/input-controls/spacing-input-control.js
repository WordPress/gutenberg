/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { sprintf, _x } from '@wordpress/i18n';
import { __experimentalUseCustomUnits as useCustomUnits } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PresetInputControl from '../../preset-input-control';
import { useSettings } from '../../use-settings';
import { store as blockEditorStore } from '../../../store';
import { ALL_SIDES, LABELS } from '../utils';

const CUSTOM_VALUE_SETTINGS = {
	px: { max: 300, steps: 1 },
	'%': { max: 100, steps: 1 },
	vw: { max: 100, steps: 1 },
	vh: { max: 100, steps: 1 },
	em: { max: 10, steps: 0.1 },
	rm: { max: 10, steps: 0.1 },
	svw: { max: 100, steps: 1 },
	lvw: { max: 100, steps: 1 },
	dvw: { max: 100, steps: 1 },
	svh: { max: 100, steps: 1 },
	lvh: { max: 100, steps: 1 },
	dvh: { max: 100, steps: 1 },
	vi: { max: 100, steps: 1 },
	svi: { max: 100, steps: 1 },
	lvi: { max: 100, steps: 1 },
	dvi: { max: 100, steps: 1 },
	vb: { max: 100, steps: 1 },
	svb: { max: 100, steps: 1 },
	lvb: { max: 100, steps: 1 },
	dvb: { max: 100, steps: 1 },
	vmin: { max: 100, steps: 1 },
	svmin: { max: 100, steps: 1 },
	lvmin: { max: 100, steps: 1 },
	dvmin: { max: 100, steps: 1 },
	vmax: { max: 100, steps: 1 },
	svmax: { max: 100, steps: 1 },
	lvmax: { max: 100, steps: 1 },
	dvmax: { max: 100, steps: 1 },
};

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
	...restProps
} ) {
	const disableCustomSpacingSizes = useSelect( ( select ) => {
		const editorSettings = select( blockEditorStore ).getSettings();
		return editorSettings?.disableCustomSpacingSizes;
	} );

	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ 'px', 'em', 'rem' ],
	} );

	// Convert spacing preset format to generic preset format for PresetInputControl
	const presets = useMemo( () => {
		return (
			spacingSizes?.map( ( preset ) => ( {
				name: preset.name,
				slug: preset.slug,
				size: preset.size,
			} ) ) || []
		);
	}, [ spacingSizes ] );

	// Generate aria label
	const sideLabel =
		( ALL_SIDES.includes( side ) ||
			[ 'vertical', 'horizontal' ].includes( side ) ) &&
		showSideInLabel
			? LABELS[ side ]
			: '';
	const typeLabel = showSideInLabel ? type?.toLowerCase() : type;

	const ariaLabel = sprintf(
		// translators: 1: The side of the block being modified (top, bottom, left etc.). 2. Type of spacing being modified (padding, margin, etc).
		_x( '%1$s %2$s', 'spacing' ),
		sideLabel,
		typeLabel
	).trim();

	// Get the first unit as default selected unit
	const selectedUnit = units[ 0 ]?.value || 'px';

	return (
		<PresetInputControl
			allowNegativeOnDrag={ minimumCustomValue < 0 }
			ariaLabel={ ariaLabel }
			className="spacing-sizes-control"
			customValueSettings={ CUSTOM_VALUE_SETTINGS }
			disableCustomValues={ disableCustomSpacingSizes }
			icon={ icon }
			isMixed={ isMixed }
			minimumCustomValue={ minimumCustomValue }
			onChange={ onChange }
			onMouseOut={ onMouseOut }
			onMouseOver={ onMouseOver }
			presets={ presets }
			presetType="spacing"
			selectedUnit={ selectedUnit }
			units={ units }
			value={ value }
			{ ...restProps }
		/>
	);
}
