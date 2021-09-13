/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
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
		if ( await confirm( 'Are you sure?' ) ) {
			setConfirmVal( "Let's do it!" );
		} else {
			setConfirmVal( 'Ok, take your time!' );
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
