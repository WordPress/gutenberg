/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BaseControl } from '../base-control';
import AllInputControl from './all-input-control';
import InputControls from './input-controls';
import AxialInputControls from './axial-input-controls';
import LinkedButton from './linked-button';
import { Grid } from '../grid';
import {
	FlexedBoxControlIcon,
	InputWrapper,
	ResetButton,
	LinkedButtonWrapper,
} from './styles/box-control-styles';
import { parseQuantityAndUnitFromRawValue } from '../unit-control/utils';
import {
	DEFAULT_VALUES,
	getInitialSide,
	isValuesMixed,
	isValuesDefined,
} from './utils';
import { useControlledState } from '../utils/hooks';
import type {
	BoxControlIconProps,
	BoxControlProps,
	BoxControlValue,
} from './types';

const defaultInputProps = {
	min: 0,
};

const noop = () => {};

function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( BoxControl, 'inspector-box-control' );

	return idProp || instanceId;
}

/**
 * BoxControl components let users set values for Top, Right, Bottom, and Left.
 * This can be used as an input control for values like `padding` or `margin`.
 *
 * ```jsx
 * import { BoxControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const Example = () => {
 * 	const [ values, setValues ] = useState( {
 * 		top: '50px',
 * 		left: '10%',
 * 		right: '10%',
 * 		bottom: '50px',
 * 	} );
 *
 * 	return (
 * 		<BoxControl
 * 			values={ values }
 * 			onChange={ ( nextValues ) => setValues( nextValues ) }
 * 		/>
 * 	);
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
		! hasInitialValue || ! isValuesMixed( inputValues ) || hasOneSide
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
		...inputProps,
		onChange: handleOnChange,
		onFocus: handleOnFocus,
		isLinked,
		units,
		selectedUnits,
		setSelectedUnits,
		sides,
		values: inputValues,
		onMouseOver,
		onMouseOut,
		__next40pxDefaultSize,
	};

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
					<FlexedBoxControlIcon side={ side } sides={ sides } />
					<AllInputControl { ...inputControlProps } />
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

			{ ! isLinked && splitOnAxis && (
				<AxialInputControls { ...inputControlProps } />
			) }
			{ ! isLinked && ! splitOnAxis && (
				<InputControls { ...inputControlProps } />
			) }
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
