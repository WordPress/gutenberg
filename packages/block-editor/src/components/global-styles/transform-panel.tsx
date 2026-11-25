import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Fieldset, Stack } from '@wordpress/ui';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import { cleanEmptyObject } from '../../hooks/utils';
import UnitRangeControl, { type UnitRangeSettings } from './unit-range-control';
import { RANGE_CONTROL_CUSTOM_SETTINGS } from '../height-control';
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
	const hasRotate = useHasRotateControl( settings );
	const hasTranslate = useHasTranslateControl( settings );
	return hasRotate || hasTranslate;
}

function useHasRotateControl( settings: StyleSettings | undefined ) {
	return !! settings?.transform?.rotate;
}

function useHasTranslateControl( settings: StyleSettings | undefined ) {
	return !! settings?.transform?.translate;
}

// An offset moves either way, so each range runs from -max to max.
const TRANSLATE_UNIT_SETTINGS: UnitRangeSettings = Object.fromEntries(
	Object.entries( RANGE_CONTROL_CUSTOM_SETTINGS ).map(
		( [ unit, { max, step } ] ) => [ unit, { min: -max, max, step } ]
	)
);

const TRANSLATE_AXES = [
	{
		axis: 'x',
		label: _x( 'X', 'Horizontal axis' ),
		controlLabel: __( 'X offset' ),
	},
	{
		axis: 'y',
		label: _x( 'Y', 'Vertical axis' ),
		controlLabel: __( 'Y offset' ),
	},
] as const;

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
	translate: true,
};

export default function TransformPanel( {
	as: Wrapper = TransformToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	baseValue,
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

	const showTranslateControl = useHasTranslateControl( settings );
	const units = useCustomUnits( {
		availableUnits: settings?.spacing?.units || [
			'%',
			'px',
			'em',
			'rem',
			'vw',
			'vh',
		],
	} );
	// An axis without its own value shows the inherited one as a placeholder.
	const getTranslate = ( axis: 'x' | 'y' ) =>
		value?.transform?.translate?.[ axis ];
	// A selected Global Styles state falls back to the Default state per axis.
	const getInheritedTranslate = ( axis: 'x' | 'y' ) =>
		inheritedValue?.transform?.translate?.[ axis ] ??
		baseValue?.transform?.translate?.[ axis ];
	// Each axis is saved on its own. The other axis comes from the styles below.
	const setTranslate = ( axis: 'x' | 'y', newValue: string | undefined ) => {
		onChange(
			setImmutably(
				value,
				[ 'transform', 'translate' ],
				cleanEmptyObject( {
					...value?.transform?.translate,
					[ axis ]: newValue,
				} )
			)
		);
	};
	const hasTranslateValue = () =>
		value?.transform?.translate?.x !== undefined ||
		value?.transform?.translate?.y !== undefined;
	const resetTranslate = () => {
		onChange(
			setImmutably( value, [ 'transform', 'translate' ], undefined )
		);
	};

	const resetAllFilter: PanelResetAllFilter = useCallback(
		( previousValue ) => {
			return {
				...previousValue,
				transform: {
					...previousValue?.transform,
					rotate: undefined,
					translate: undefined,
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
			{ showTranslateControl && (
				<ToolsPanelItem
					label={ __( 'Offset' ) }
					hasValue={ hasTranslateValue }
					onDeselect={ resetTranslate }
					isShownByDefault={ defaultControls.translate }
					panelId={ panelId }
				>
					<Fieldset.Root>
						<Fieldset.Legend>{ __( 'Offset' ) }</Fieldset.Legend>
						<Stack direction="column" gap="md">
							{ TRANSLATE_AXES.map(
								( { axis, label, controlLabel } ) => (
									<UnitRangeControl
										key={ axis }
										label={ label }
										controlLabel={ controlLabel }
										value={ getTranslate( axis ) }
										placeholder={ getInheritedTranslate(
											axis
										) }
										onChange={ ( newValue ) =>
											setTranslate( axis, newValue )
										}
										units={ units }
										unitSettings={ TRANSLATE_UNIT_SETTINGS }
									/>
								)
							) }
						</Stack>
					</Fieldset.Root>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
