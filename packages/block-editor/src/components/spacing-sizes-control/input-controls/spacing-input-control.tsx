import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { sprintf, _x } from '@wordpress/i18n';
import { __experimentalUseCustomUnits as useCustomUnits } from '@wordpress/components';
import PresetInputControl from '../../preset-input-control';
import { useSettings } from '../../use-settings';
import { store as blockEditorStore } from '../../../store';
import { ALL_SIDES, LABELS } from '../utils';
import type { Side, SpacingInputControlProps } from '../types';

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
}: SpacingInputControlProps ) {
	const disableCustomSpacingSizes = useSelect( ( select ) => {
		const editorSettings = select( blockEditorStore ).getSettings();
		// The setting is a boolean flag.
		return editorSettings?.disableCustomSpacingSizes as boolean | undefined;
	} );

	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		// The setting lists unit names.
		availableUnits: ( availableUnits as string[] | undefined ) || [
			'px',
			'em',
			'rem',
		],
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
		( ALL_SIDES.includes( side as Side ) ||
			[ 'vertical', 'horizontal' ].includes( side ) ) &&
		showSideInLabel
			? // Only sides and axes have labels.
				LABELS[ side as keyof typeof LABELS ]
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
			// An unset minimum compares as `NaN`, which is not negative.
			allowNegativeOnDrag={ ( minimumCustomValue as number ) < 0 }
			ariaLabel={ ariaLabel }
			className="spacing-sizes-control"
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
