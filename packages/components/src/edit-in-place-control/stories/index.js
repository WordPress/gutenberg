/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useInlineEdit } from '../use-inline-edit';

export default {
	title: 'Components/EditInPlaceControl',
	component: MyCustomEditInPlaceControl,
};

function MyCustomEditInPlaceControl( props = {} ) {
	const { isEdit, amendInputProps, amendToggleProps, value } = useInlineEdit(
		props
	);

	const buttonProps = {
		onClick: ( _value ) =>
			// eslint-disable-next-line no-console
			console.log( 'custom handle on click', _value ),
	};
	const inputProps = { value };

	return (
		<>
			{ isEdit ? (
				<input { ...amendInputProps( ...inputProps ) } />
			) : (
				<button { ...amendToggleProps( ...buttonProps ) }>
					{ value }
				</button>
			) }
		</>
	);
}

export const _default = () => {
	const validate = ( _value ) => _value.length > 0;
	const initialValue = text( 'Initial value', 'Input initial value' );
	const [ onClickCallbacks, setOnClickCallbacks ] = useState( 0 );
	const [ onChangeCallbacks, setOnChangeCallbacks ] = useState( 0 );
	const [ value, setValue ] = useState( initialValue );
	const [ isInputValid, setIsInputValid ] = useState( true );

	const incrementOnClickCallbacks = () =>
		setOnClickCallbacks( 1 + onClickCallbacks );

	const incrementOnChangeCallbacks = () =>
		setOnChangeCallbacks( 1 + onChangeCallbacks );

	const props = {
		value,
		validate,
		onClick: incrementOnClickCallbacks,
		inputValidator: validate,
		onChange: ( _value ) => (
			setValue( _value ),
			incrementOnChangeCallbacks( _value ),
			setIsInputValid( true )
		),
		onWrongInput: () => setIsInputValid( false ),
	};

	return (
		<>
			<MyCustomEditInPlaceControl { ...props } />
			<ul>
				<li> onClick callbacks: { onClickCallbacks } </li>
				<li> onChange callback: { onChangeCallbacks } </li>
				<li> value: { onChangeCallbacks } </li>
				<li> inputValidator: is defined </li>
				<li> is input valid: { isInputValid + '' } </li>
			</ul>
		</>
	);
};
