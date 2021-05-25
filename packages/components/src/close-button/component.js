/**
 * WordPress dependencies
 */
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { contextConnect, useContextSystem } from '../ui/context';
import { Button } from '../button';

function CloseButton( props, forwardedRef ) {
	const { ...otherProps } = useContextSystem( props, 'CloseButton' );

	return (
		<Button
			icon={ close }
			iconSize={ 12 }
			variant="tertiary"
			{ ...otherProps }
			ref={ forwardedRef }
		/>
	);
}

export default contextConnect( CloseButton, 'CloseButton' );
