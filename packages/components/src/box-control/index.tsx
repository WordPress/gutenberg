/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import { BaseControl } from '../base-control';
import InputControl from './input-control';
import LinkedButton from './linked-button';
import { Grid } from '../grid';
import {
	InputWrapper,
	ResetButton,
	LinkedButtonWrapper,
} from './styles/box-control-styles';
import { parseQuantityAndUnitFromRawValue } from '../unit-control/utils';
import {
	DEFAULT_VALUES,
	getInitialSide,
	isValueMixed,
	isValuesDefined,
	getAllowedSides,
} from './utils';
import { useControlledState } from '../utils/hooks';
import type {
	BoxControlIconProps,
	BoxControlProps,
	BoxControlValue,
} from './types';
import { maybeWarnDeprecated36pxSize } from '../utils/deprecated-36px-size';

const defaultInputProps = {
	min: 0,
};

const noop = () => {};

function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( BoxControl, 'inspector-box-control' );

	return idProp || instanceId;
}

/**
 * A control that lets users set values for top, right, bottom, and left. Can be
 * used as an input control for values like `padding` or `margin`.
 *
 * ```jsx
 * import { useState } from 'react';
 * import { BoxControl } from '@wordpress/components';
 *
 * function Example() {
 *   const [ values, setValues ] = useState( {
 *     top: '50px',
 *     left: '10%',
 *     right: '10%',
 *     bottom: '50px',
 *   } );
 *
 *   return (
 *     <BoxControl
 *       __next40pxDefaultSize
 *       values={ values }
 *       onChange={ setValues }
 *     />
 *   );
 * };
 * ```
 */
function BoxControl( {
	__next40pxDefaultSize = false,
	id: idProp,
	inputProps = defaultInputProps,
	onChange = noop,
	label = __( 'Box Control' ),
	values: valuesProp,
	units,
	sides,
	splitOnAxis = false,
	allowReset = true,
	resetValues = DEFAULT_VALUES,
	presets,
	presetKey,
	onMouseOver,
	onMouseOut,
}: BoxControlProps ) {
	const [ values, setValues ] = useControlledState( valuesProp, {
		fallback: DEFAULT_VALUES,
	} );
	const inputValues = values || DEFAULT_VALUES;
	const hasInitialValue = isValuesDefined( valuesProp );
	const hasOneSide = sides?.length === 1;

	const [ isDirty, setIsDirty ] = useState( hasInitialValue );
	const [ isLinked, setIsLinked ] = useState(
		! hasInitialValue || ! isValueMixed( inputValues ) || hasOneSide
	);

	const [ side, setSide ] = useState< BoxControlIconProps[ 'side' ] >(
		getInitialSide( isLinked, splitOnAxis )
	);

	// Tracking selected units via internal state allows filtering of CSS unit
	// only values from being saved while maintaining preexisting unit selection
	// behaviour. Filtering CSS only values prevents invalid style values.
	const [ selectedUnits, setSelectedUnits ] = useState< BoxControlValue >( {
		top: parseQuantityAndUnitFromRawValue( valuesProp?.top )[ 1 ],
		right: parseQuantityAndUnitFromRawValue( valuesProp?.right )[ 1 ],
		bottom: parseQuantityAndUnitFromRawValue( valuesProp?.bottom )[ 1 ],
		left: parseQuantityAndUnitFromRawValue( valuesProp?.left )[ 1 ],
	} );

	const id = useUniqueId( idProp );
	const headingId = `${ id }-heading`;

	const toggleLinked = () => {
		setIsLinked( ! isLinked );
		setSide( getInitialSide( ! isLinked, splitOnAxis ) );
	};

	const handleOnFocus = (
		_event: React.FocusEvent< HTMLInputElement >,
		{ side: nextSide }: { side: typeof side }
	) => {
		setSide( nextSide );
	};

	const handleOnChange = ( nextValues: BoxControlValue ) => {
		onChange( nextValues );
		setValues( nextValues );
		setIsDirty( true );
	};

	const handleOnReset = () => {
		onChange( resetValues );
		setValues( resetValues );
		setSelectedUnits( resetValues );
		setIsDirty( false );
	};

	const inputControlProps = {
		onMouseOver,
		onMouseOut,
		...inputProps,
		onChange: handleOnChange,
		onFocus: handleOnFocus,
		isLinked,
		units,
		selectedUnits,
		setSelectedUnits,
		sides,
		values: inputValues,
		__next40pxDefaultSize,
		presets,
		presetKey,
	};

	maybeWarnDeprecated36pxSize( {
		componentName: 'BoxControl',
		__next40pxDefaultSize,
		size: undefined,
	} );
	const sidesToRender = getAllowedSides( sides );

	if ( ( presets && ! presetKey ) || ( ! presets && presetKey ) ) {
		const definedProp = presets ? 'presets' : 'presetKey';
		const missingProp = presets ? 'presetKey' : 'presets';
		warning(
			`wp.components.BoxControl: the '${ missingProp }' prop is required when the '${ definedProp }' prop is defined.`
		);
	}

	return (
		<Grid
			id={ id }
			columns={ 3 }
			templateColumns="1fr min-content min-content"
			role="group"
			aria-labelledby={ headingId }
		>
			<BaseControl.VisualLabel id={ headingId }>
				{ label }
			</BaseControl.VisualLabel>
			{ isLinked && (
				<InputWrapper>
					<InputControl side="all" { ...inputControlProps } />
				</InputWrapper>
			) }
			{ ! hasOneSide && (
				<LinkedButtonWrapper>
					<LinkedButton
						onClick={ toggleLinked }
						isLinked={ isLinked }
					/>
				</LinkedButtonWrapper>
			) }

			{ ! isLinked &&
				splitOnAxis &&
				[ 'vertical', 'horizontal' ].map( ( axis ) => (
					<InputControl
						key={ axis }
						side={ axis as 'horizontal' | 'vertical' }
						{ ...inputControlProps }
					/>
				) ) }
			{ ! isLinked &&
				! splitOnAxis &&
				Array.from( sidesToRender ).map( ( axis ) => (
					<InputControl
						key={ axis }
						side={ axis }
						{ ...inputControlProps }
					/>
				) ) }
			{ allowReset && (
				<ResetButton
					className="component-box-control__reset-button"
					variant="secondary"
					size="small"
					onClick={ handleOnReset }
					disabled={ ! isDirty }
				>
					{ __( 'Reset' ) }
				</ResetButton>
			) }
		</Grid>
	);
}

export { applyValueToSides } from './utils';
export default BoxControl;
