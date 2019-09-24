/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { createRequest } from './codesandbox-button.utils';

export default function CodeSandboxButton( props ) {
	const {
		live: { code },
		name,
	} = props;

	const handleOnClick = () => createRequest( { code, name } );

	return (
		<Button isDefault isSmall onClick={ handleOnClick }>
			Edit in Sandbox
		</Button>
	);
}

CodeSandboxButton.defaultProps = {
	live: {},
};
