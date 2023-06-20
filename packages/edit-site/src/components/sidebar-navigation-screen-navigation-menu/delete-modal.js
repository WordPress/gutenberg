/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	Modal,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function RenameModal( { onClose, onConfirm } ) {
	return (
		<Modal title={ __( 'Delete' ) } onRequestClose={ onClose }>
			<form>
				<VStack spacing="3">
					<p>
						{ __(
							'Are you sure you want to delete this Navigation menu?'
						) }
					</p>
					<HStack justify="right">
						<Button variant="tertiary" onClick={ onClose }>
							{ __( 'Cancel' ) }
						</Button>

						<Button
							variant="primary"
							type="submit"
							onClick={ ( e ) => {
								e.preventDefault();
								onConfirm();

								// Immediate close avoids ability to hit delete multiple times.
								onClose();
							} }
						>
							{ __( 'Delete' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
