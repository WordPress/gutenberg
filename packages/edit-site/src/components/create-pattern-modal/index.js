/**
 * WordPress dependencies
 */
import {
	TextControl,
	Button,
	Modal,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

export default function CreatePatternModal( { closeModal, onCreate } ) {
	const [ name, setName ] = useState( '' );
	const [ isSubmitting, setIsSubmitting ] = useState( false );

	return (
		<Modal
			title={ __( 'Create a pattern' ) }
			onRequestClose={ closeModal }
			overlayClassName="edit-site-create-pattern-modal"
		>
			<form
				onSubmit={ async ( event ) => {
					event.preventDefault();
					if ( ! name ) {
						return;
					}
					setIsSubmitting( true );
					await onCreate( { name } );
				} }
			>
				<VStack spacing="4">
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Name' ) }
						value={ name }
						onChange={ setName }
						required
					/>
					<HStack justify="right">
						<Button
							variant="tertiary"
							onClick={ () => {
								closeModal();
							} }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							type="submit"
							disabled={ ! name }
							isBusy={ isSubmitting }
						>
							{ __( 'Create' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
