/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	TextControl,
	Modal,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function RenameModal( {
	onClose,
	editedMenuTitle,
	onChange,
	handleSave,
} ) {
	return (
		<Modal title="Rename" onRequestClose={ onClose }>
			<form>
				<VStack spacing="3">
					<TextControl
						__nextHasNoMarginBottom
						value={ editedMenuTitle }
						placeholder={ __( 'Navigation title' ) }
						onChange={ onChange }
					/>
					<HStack justify="right">
						<Button variant="tertiary" onClick={ onClose }>
							{ __( 'Cancel' ) }
						</Button>

						<Button
							variant="primary"
							type="submit"
							onClick={ handleSave }
						>
							{ __( 'Save' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
