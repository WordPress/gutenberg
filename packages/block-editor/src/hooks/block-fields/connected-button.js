/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
} from '@wordpress/components';
import { connection, linkOff } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function ConnectedButton( { isConnected, ...props } ) {
	const label = isConnected ? __( 'Disconnect' ) : __( 'Connect' );

	return (
		<InputControlSuffixWrapper variant="control">
			<Button
				{ ...props }
				size="small"
				icon={ isConnected ? connection : linkOff }
				iconSize={ 24 }
				label={ label }
			/>
		</InputControlSuffixWrapper>
	);
}
