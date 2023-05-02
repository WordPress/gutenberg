/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	Modal,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';

/**
 * Returns a modal to confirm the user wants to load a revision in the presence of unsaved changes.
 *
 * @typedef {Object} props
 * @property {Function} onClose   Callback fired when the modal is closed or action cancelled.
 * @property {Function} onSubmit  Callback fired when the modal is submitted.
 *
 * @param    {props}    Component props.
 * @return {JSX.Element} The modal component.
 */
function RestoreGlobalStylesRevisionModal( { onClose, onSubmit } ) {
	return (
		<Modal
			title={ __( 'You have unsaved changes in the editor' ) }
			focusOnMount={ true }
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
			isDismissible={ false }
			onRequestClose={ onClose }
		>
			<form onSubmit={ onSubmit }>
				<VStack spacing="5">
					<Text as="p">
						{ __(
							'Loading a revision will replace any unsaved changes. Would you like continue?'
						) }
					</Text>
					<HStack justify="right">
						<Button variant="tertiary" onClick={ onClose }>
							{ __( 'No' ) }
						</Button>

						<Button variant="primary" type="submit">
							{ __( 'Yes' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}

export default RestoreGlobalStylesRevisionModal;
