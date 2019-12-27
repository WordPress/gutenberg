/**
 * External dependencies
 */
import { isFinite } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose, withInstanceId, withState } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { BaseControl, Button, Dashicon } from '../';

function RangeControl( {
	className,
	currentInput,
	label,
	value,
	instanceId,
	onChange,
	beforeIcon,
	afterIcon,
	help,
	allowReset,
	initialPosition,
	min,
	max,
	setState,
	...props
} ) {
	const id = `inspector-range-control-${ instanceId }`;
	const currentInputValue = currentInput === null ? value : currentInput;
	const resetValue = () => {
		resetCurrentInput();
		onChange();
	};
	const resetCurrentInput = () => {
		if ( currentInput !== null ) {
			setState( {
				currentInput: null,
			} );
		}
	};

	const onChangeValue = ( event ) => {
		const newValue = event.target.value;
		// If the input value is invalid temporarily save it to the state,
		// without calling on change.
		if ( ! event.target.checkValidity() ) {
			setState( {
				currentInput: newValue,
			} );
			return;
		}
		// The input is valid, reset the local state property used to temporaly save the value,
		// and call onChange with the new value as a number.
		resetCurrentInput();
		onChange( ( newValue === '' ) ?
			undefined :
			parseFloat( newValue )
		);
	};

	const initialFallbackValue = isFinite( initialPosition ) ?
		initialPosition : '';

	const initialSliderValue = isFinite( currentInputValue ) ?
		currentInputValue : initialFallbackValue;

	return (
		<BaseControl
			label={ label }
			id={ id }
			help={ help }
			className={ classnames( 'components-range-control', className ) }
		>
			{ beforeIcon && <Dashicon icon={ beforeIcon } /> }
			<input
				className="components-range-control__slider"
				id={ id }
				type="range"
				value={ initialSliderValue }
				onChange={ onChangeValue }
				aria-describedby={ !! help ? id + '__help' : undefined }
				min={ min }
				max={ max }
				{ ...props } />
			{ afterIcon && <Dashicon icon={ afterIcon } /> }
			<input
				className="components-range-control__number"
				type="number"
				onChange={ onChangeValue }
				aria-label={ label }
				value={ currentInputValue }
				min={ min }
				max={ max }
				onBlur={ resetCurrentInput }
				{ ...props }
			/>
			{ allowReset && (
				<Button
					onClick={ resetValue }
					disabled={ value === undefined }
					isSmall
					isSecondary
					className="components-range-control__reset"
				>
					{ __( 'Reset' ) }
				</Button>
			) }
		</BaseControl>
	);
}

export default compose( [
	withInstanceId,
	withState( {
		currentInput: null,
	} ),
] )( RangeControl );
