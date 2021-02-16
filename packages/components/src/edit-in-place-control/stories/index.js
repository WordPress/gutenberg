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
import EditInPlaceControl from '../';
import { isUndefined, negate } from 'lodash';

export default {
	title: 'Components/EditInPlaceControl',
	component: EditInPlaceControl,
};

export const _default = () => {
	const [ onClickCallbacks, setOnClickCallbacks ] = useState( 0 );
	const [ onUpdateCallbacks, setOnUpdateCallbacks ] = useState( 0 );
	const [ onChangeCallbacks, setOnChangeCallbacks ] = useState( 0 );
	const [ onKeydownCallbacks, setOnKeydownCallbacks ] = useState( 0 );

	const incrementOnClickCallbacks = () =>
		setOnClickCallbacks( 1 + onClickCallbacks );
	const incrementOnUpdateCallbacks = () =>
		setOnUpdateCallbacks( 1 + onUpdateCallbacks );
	const incrementOnChangeCallbacks = () =>
		setOnChangeCallbacks( 1 + onChangeCallbacks );
	const incrementOnKeydownCallbacks = () =>
		setOnKeydownCallbacks( 1 + onKeydownCallbacks );

	const initialValue = text( 'Initial value', 'Input initial value' );
	const switchToEditModeButtonLabel = text(
		'Aria label informing user, the button will switch to edit mode on click',
		'Edit mode'
	);
	const inputLabel = text(
		'Aria label attached to input (when on edit mdoe)',
		'Input text'
	);

	const props = {
		initialValue,
		onClick: incrementOnClickCallbacks,
		onUpdate: incrementOnUpdateCallbacks,
		switchToEditModeButtonLabel,
		inputValidator: negate( isUndefined ),
		inputLabel,
		onChange: incrementOnChangeCallbacks,
		onKeyDown: incrementOnKeydownCallbacks,
	};

	return (
		<>
			<EditInPlaceControl { ...props } />
			<ul>
				<li> onClick callbacks: { onClickCallbacks } </li>
				<li> onUpdate callbacks: { onUpdateCallbacks } </li>
				<li> onChange callback: { onChangeCallbacks } </li>
				<li> onKeyDown callback: { onKeydownCallbacks } </li>
				<li> inputValidator: is defined </li>
			</ul>
		</>
	);
};
