/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import React, { useState } from 'react';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { ConfirmDialog } from '..';

export default {
	component: ConfirmDialog,
	title: 'Components (Experimental)/ConfirmDialog',
	argTypes: { proceed: { action: 'proceed' } },
};

const placeholderMessage = 'Are you sure?';

// Simplest usage: just declare the component with the required `onConfirm` prop.
export const _default = () => {
	const [ confirmVal, setConfirmVal ] = useState( 'Not confirmed' );

	return (
		<>
			<ConfirmDialog
				message={ placeholderMessage }
				onConfirm={ () => setConfirmVal( 'Confirmed!' ) }
			/>
			<h1>{ confirmVal }</h1>
		</>
	);
};

//
export const UncontrolledAndWithExplicitOnCancel = () => {
	const [ confirmVal, setConfirmVal ] = useState( 'Not confirmed' );

	return (
		<>
			<ConfirmDialog
				message={ placeholderMessage }
				onConfirm={ () => setConfirmVal( 'Confirmed!' ) }
				onCancel={ () => setConfirmVal( 'Cancelled' ) }
			/>
			<h1>{ confirmVal }</h1>
		</>
	);
};

export const ControlledWithExplicitOnCancel = () => {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ confirmVal, setConfirmVal ] = useState( 'Not confirmed' );

	const handleConfirm = () => {
		setConfirmVal( 'Confirmed!' );
		setIsOpen( false );
	};

	const handleCancel = () => {
		setConfirmVal( 'Cancelled' );
		setIsOpen( false );
	};

	return (
		<>
			<ConfirmDialog
				message={ placeholderMessage }
				isOpen={ isOpen }
				onConfirm={ handleConfirm }
				onCancel={ handleCancel }
			/>
			<Button variant="primary" onClick={ () => setIsOpen( true ) }>
				Open ConfirmDialog
			</Button>
			<h1>{ confirmVal }</h1>
		</>
	);
};
