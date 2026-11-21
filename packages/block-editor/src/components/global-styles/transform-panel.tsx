import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import UnitRangeControl, { type UnitRangeSettings } from './unit-range-control';
import type {
	PanelResetAllFilter,
	StyleSettings,
	StyleToolsPanelProps,
	TransformPanelProps,
} from './types';

const ROTATE_UNITS = [
	{ value: 'deg', label: 'deg' },
	{ value: 'turn', label: 'turn' },
	{ value: 'rad', label: 'rad' },
	{ value: 'grad', label: 'grad' },
];

const ROTATE_UNIT_SETTINGS: UnitRangeSettings = {
	deg: { min: -360, max: 360, step: 1 },
	turn: { min: -1, max: 1, step: 0.01 },
	rad: { min: -6.28, max: 6.28, step: 0.01 },
	grad: { min: -400, max: 400, step: 1 },
};

export function useHasTransformPanel( settings: StyleSettings | undefined ) {
	return useHasRotateControl( settings );
}

function useHasRotateControl( settings: StyleSettings | undefined ) {
	return !! settings?.transform?.rotate;
}

function TransformToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
}: StyleToolsPanelProps ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ _x(
				'Transform',
				'Visual transform styles such as rotate, move and scale'
			) }
			resetAll={ resetAll }
			panelId={ panelId }
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS: Record< string, boolean > = {
	rotate: true,
};

export default function TransformPanel( {
	as: Wrapper = TransformToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
}: TransformPanelProps ) {
	const showRotateControl = useHasRotateControl( settings );
	const storedRotate =
		value?.transform?.rotate ?? inheritedValue?.transform?.rotate;
	const rotate = typeof storedRotate === 'string' ? storedRotate : undefined;
	const setRotate = ( newValue: string | undefined ) => {
		onChange( setImmutably( value, [ 'transform', 'rotate' ], newValue ) );
	};
	const hasRotateValue = () => value?.transform?.rotate !== undefined;
	const resetRotate = () => setRotate( undefined );

	const resetAllFilter: PanelResetAllFilter = useCallback(
		( previousValue ) => {
			return {
				...previousValue,
				transform: {
					...previousValue?.transform,
					rotate: undefined,
				},
			};
		},
		[]
	);

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
		>
			{ showRotateControl && (
				<ToolsPanelItem
					label={ __( 'Rotation' ) }
					hasValue={ hasRotateValue }
					onDeselect={ resetRotate }
					isShownByDefault={ defaultControls.rotate }
					panelId={ panelId }
				>
					<UnitRangeControl
						label={ __( 'Rotation' ) }
						value={ rotate }
						onChange={ setRotate }
						units={ ROTATE_UNITS }
						unitSettings={ ROTATE_UNIT_SETTINGS }
					/>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
