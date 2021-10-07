/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import React, { useState } from 'react';
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { ConfirmDialog } from '..';

export default {
	component: ConfirmDialog,
	title: 'Components (Experimental)/ConfirmDialog',
};

const daText = () =>
	text( 'message', 'Would you like to privetely publish the post now?' );

// Simplest usage: just declare the component with the required `onConfirm` prop.
export const _default = () => {
	const [ confirmVal, setConfirmVal ] = useState( 'Not confirmed' );

	return (
		<>
			<ConfirmDialog
				message={ daText() }
				onConfirm={ () => setConfirmVal( 'Confirmed!' ) }
			/>
			<h1>{ confirmVal }</h1>
		</>
	);
};

export const WithTitle = () => {
	const [ confirmVal, setConfirmVal ] = useState( 'Not confirmed' );

	return (
		<>
			<ConfirmDialog
				title="Are you sure?"
				message={ daText() }
				onConfirm={ () => setConfirmVal( 'Confirmed!' ) }
			/>
			<h1>{ confirmVal }</h1>
		</>
	);
};

export const WithJSXMessage = () => {
	const [ confirmVal, setConfirmVal ] = useState( 'Not confirmed' );

	return (
		<>
			<ConfirmDialog
				message={ <h1>{ daText() }</h1> }
				onConfirm={ () => setConfirmVal( 'Confirmed!' ) }
			/>
			<h1>{ confirmVal }</h1>
		</>
	);
};

export const VeeeryLongMessage = () => {
	const [ confirmVal, setConfirmVal ] = useState( 'Not confirmed' );

	return (
		<>
			<ConfirmDialog
				message={ daText().repeat( 20 ) }
				onConfirm={ () => setConfirmVal( 'Confirmed!' ) }
			/>
			<h1>{ confirmVal }</h1>
		</>
	);
};

export const UncontrolledAndWithExplicitOnCancel = () => {
	const [ confirmVal, setConfirmVal ] = useState( 'Not confirmed' );

	return (
		<>
			<ConfirmDialog
				message={ daText() }
				onConfirm={ () => setConfirmVal( 'Confirmed!' ) }
				onCancel={ () => setConfirmVal( 'Cancelled' ) }
			/>
			<h1>{ confirmVal }</h1>
		</>
	);
};

// Controlled `ConfirmDialog`s require both `onConfirm` *and* `onCancel to be passed
// It's expected that the user will then use it to hide the dialog, too (see the
// `setIsOpen` calls below).
export const Controlled = () => {
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
				message={ daText() }
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
