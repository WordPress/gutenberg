import type { ComponentProps } from 'react';
import {
	__experimentalNumberControl as NumberControl,
	RangeControl,
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

// Mirror of `WP_Style_Engine::VALID_SCALE_PATTERN` in PHP.
const SCALE_PATTERN = /^((?:\d+(?:\.\d+)?|\.\d+))(%?)$/;

type ScaleStateReducer = NonNullable<
	ComponentProps< typeof NumberControl >[ '__unstableStateReducer' ]
>;

const SCALE_STEP = 0.01;
// Mirror of NumberControl's default `shiftStep`.
const SCALE_SHIFT_STEP = SCALE_STEP * 10;
const SCALE_SLIDER_MAX = 3;
// The slider stops at 3, but a typed scale may go up to 10.
const SCALE_INPUT_MAX = 10;

/**
 * Converts a scale value to the number the scale field shows.
 *
 * @param value A scale, such as `1.2` or `'120%'`.
 * @return The scale as a number, such as `1.2`, or `undefined` when the value
 * is not a single non-negative number or percentage.
 */
export function getScaleAsNumber( value: unknown ): number | undefined {
	const scale =
		typeof value === 'number' && Number.isFinite( value )
			? String( value )
			: value;
	const match =
		typeof scale === 'string' ? SCALE_PATTERN.exec( scale ) : null;
	if ( ! match ) {
		return undefined;
	}
	return match[ 2 ] ? Number( match[ 1 ] ) / 100 : Number( match[ 1 ] );
}

export function useHasTransformPanel( settings: StyleSettings | undefined ) {
	const hasRotate = useHasRotateControl( settings );
	const hasTranslate = useHasTranslateControl( settings );
	const hasScale = useHasScaleControl( settings );
	return hasRotate || hasTranslate || hasScale;
}

function useHasRotateControl( settings: StyleSettings | undefined ) {
	return !! settings?.transform?.rotate;
}

function useHasTranslateControl( settings: StyleSettings | undefined ) {
	return !! settings?.transform?.translate;
}

function useHasScaleControl( settings: StyleSettings | undefined ) {
	return !! settings?.transform?.scale;
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
	scale: true,
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

	const showScaleControl = useHasScaleControl( settings );
	const scale =
		getScaleAsNumber( value?.transform?.scale ) ??
		getScaleAsNumber( inheritedValue?.transform?.scale );
	const setScale = ( newValue: number | undefined ) => {
		onChange( setImmutably( value, [ 'transform', 'scale' ], newValue ) );
	};
	const onScaleInputChange = ( newValue: string | undefined ) => {
		// A cleared field removes the value, so an inherited scale shows again.
		if ( newValue === undefined || newValue === '' ) {
			setScale( undefined );
			return;
		}
		const nextScale = Number( newValue );
		if ( ! Number.isFinite( nextScale ) || nextScale < 0 ) {
			return;
		}
		setScale( nextScale );
	};
	// An arrow key in an empty field spins from 0. Step from the unscaled size
	// inside the field's own state instead, so the next press steps from there.
	const stepFromUnscaled: ScaleStateReducer = ( state, action ) => {
		if (
			scale !== undefined ||
			( action.type !== 'PRESS_UP' && action.type !== 'PRESS_DOWN' )
		) {
			return state;
		}
		const { event } = action.payload;
		const step =
			event && 'shiftKey' in event && event.shiftKey
				? SCALE_SHIFT_STEP
				: SCALE_STEP;
		const next = action.type === 'PRESS_UP' ? 1 + step : 1 - step;
		return { ...state, value: `${ parseFloat( next.toPrecision( 12 ) ) }` };
	};
	const hasScaleValue = () => value?.transform?.scale !== undefined;

	const resetAllFilter: PanelResetAllFilter = useCallback(
		( previousValue ) => {
			return {
				...previousValue,
				transform: {
					...previousValue?.transform,
					rotate: undefined,
					translate: undefined,
					scale: undefined,
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
			{ showScaleControl && (
				<ToolsPanelItem
					label={ __( 'Scale' ) }
					hasValue={ hasScaleValue }
					onDeselect={ () => setScale( undefined ) }
					isShownByDefault={ defaultControls.scale }
					panelId={ panelId }
				>
					<Fieldset.Root>
						<Fieldset.Legend>{ __( 'Scale' ) }</Fieldset.Legend>
						<Stack direction="row" align="center" gap="md">
							<NumberControl
								className="block-editor-global-styles-unit-range-control__input"
								label={ __( 'Scale' ) }
								hideLabelFromVision
								value={ scale ?? '' }
								min={ 0 }
								max={ SCALE_INPUT_MAX }
								step={ SCALE_STEP }
								spinControls="none"
								placeholder="1"
								onChange={ onScaleInputChange }
								__unstableStateReducer={ stepFromUnscaled }
							/>
							<RangeControl
								className="block-editor-global-styles-unit-range-control__slider"
								label={ __( 'Scale' ) }
								hideLabelFromVision
								value={ scale }
								min={ 0 }
								max={ SCALE_SLIDER_MAX }
								step={ SCALE_STEP }
								initialPosition={ 1 }
								withInputField={ false }
								onChange={ setScale }
							/>
						</Stack>
					</Fieldset.Root>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
