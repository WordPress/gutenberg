/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';
/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { pick } from 'lodash';

/**
 * Internal dependencies
 */
import useInlineEdit from '../hook';

export default {
	title: 'Components/EditInPlaceControl',
	component: MyCustomEditInPlaceControl,
};

function MyCustomEditInPlaceControl( props = {} ) {
	const { isEdit, amendInputProps, amendToggleProps, value } = useInlineEdit(
		props
	);
	return (
		<>
			{ isEdit ? (
				<input { ...amendInputProps( { value } ) } />
			) : (
				<button { ...amendToggleProps( pick( props, 'onClick' ) ) }>
					{ value }
				</button>
			) }
		</>
	);
}

export const _default = () => {
	const validate = ( _value = '' ) => _value.length > 0;
	const initialValue = text( 'Initial value', 'Input initial value' );
	const [ onClickCallbacks, setOnClickCallbacks ] = useState( 0 );
	const [ ocCommitCallbacks, setOnCommitCallbacks ] = useState( 0 );
	const [ value, setValue ] = useState( initialValue );
	const [ isInputValid, setIsInputValid ] = useState( true );

	useEffect( () => {
		setValue( initialValue );
	}, [ initialValue ] );

	const incrementOnClickCallbacks = () =>
		setOnClickCallbacks( 1 + onClickCallbacks );

	const incrementOnCommitCallbacks = () =>
		setOnCommitCallbacks( 1 + ocCommitCallbacks );

	const props = {
		value,
		validate,
		onClick: incrementOnClickCallbacks,
		inputValidator: validate,
		onCommit: ( _value ) => (
			setValue( _value ),
			incrementOnCommitCallbacks(),
			setIsInputValid( true )
		),
		onWrongInput: () => setIsInputValid( false ),
	};

	return (
		<>
			<MyCustomEditInPlaceControl { ...props } />
			<ul>
				<li> onClick callbacks: { onClickCallbacks } </li>
				<li> onCommit callback: { ocCommitCallbacks } </li>
				<li> inputValidator: is defined </li>
				<li> is commited input valid: { isInputValid + '' } </li>
			</ul>
		</>
	);
};
