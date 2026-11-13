import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import { unlock } from '../../lock-unlock';
import type {
	PanelResetAllFilter,
	StyleSettings,
	StyleToolsPanelProps,
	TransformPanelProps,
} from './types';

const { PrivateAnglePickerControl } = unlock( componentsPrivateApis );

// Mirror of `WP_Style_Engine::VALID_ANGLE_PATTERN` in PHP.
const ANGLE_PATTERN =
	/^(?:([+-]?(?:\d+(?:\.\d+)?|\.\d+))(deg|grad|rad|turn)|0)$/i;

const DEGREES_PER_UNIT: Record< string, number > = {
	deg: 1,
	grad: 0.9,
	rad: 180 / Math.PI,
	turn: 360,
};

/**
 * Converts a CSS angle to whole degrees, the step the angle picker accepts.
 * A fraction would fail the field's validation and be rewritten on blur.
 *
 * @param value A CSS angle, such as `45deg` or `0.25turn`.
 * @return The angle in degrees, or `undefined` when the value is not an angle.
 */
export function getAngleInDegrees( value: unknown ): number | undefined {
	const match =
		typeof value === 'string' ? ANGLE_PATTERN.exec( value ) : null;
	if ( ! match ) {
		return undefined;
	}
	if ( ! match[ 1 ] ) {
		return 0;
	}
	const degrees =
		Number( match[ 1 ] ) * DEGREES_PER_UNIT[ match[ 2 ].toLowerCase() ];
	// Adding 0 turns -0 into 0.
	return Math.round( degrees ) + 0;
}

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
			label={ __( 'Transform' ) }
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
	const rotate =
		getAngleInDegrees( value?.transform?.rotate ) ??
		getAngleInDegrees( inheritedValue?.transform?.rotate );
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
					<PrivateAnglePickerControl
						label={ __( 'Rotation' ) }
						value={ rotate }
						min={ -360 }
						max={ 360 }
						allowEmpty
						onChange={ ( newValue: number | undefined ) =>
							setRotate(
								newValue === undefined
									? undefined
									: `${ Math.round( newValue ) }deg`
							)
						}
					/>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
