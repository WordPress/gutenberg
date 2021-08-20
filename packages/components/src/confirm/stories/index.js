/**
 * External dependencies
 */
import React, { useState } from 'react';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { Confirm, confirm } from '..';

export default {
	component: Confirm,
	title: 'Components (Experimental)/Confirm',
	argTypes: { proceed: { action: 'proceed' } },
};

export const _default = () => {
	const [ confirmVal, setConfirmVal ] = useState();

	async function triggerConfirm() {
		if ( await confirm( { confirmation: 'Are you sure?' } ) ) {
			setConfirmVal( 'You are sure!' );
		} else {
			setConfirmVal( 'Ok, take more time to decide!' );
		}
	}

	return (
		<>
			<Button variant="primary" onClick={ triggerConfirm }>
				Trigger Confirm
			</Button>
			{ confirmVal && <h1>{ confirmVal }</h1> }
		</>
	);
};
