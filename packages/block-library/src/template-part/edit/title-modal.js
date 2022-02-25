/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	TextControl,
	Flex,
	FlexItem,
	Button,
	Modal,
} from '@wordpress/components';

export default function TitleModal( { areaLabel, onClose, onSubmit } ) {
	// Restructure onCreate to set the blocks on local state.
	// Add modal to confirm title and trigger onCreate.
	const [ title, setTitle ] = useState( __( 'Untitled Template Part' ) );

	const submitForCreation = ( event ) => {
		event.preventDefault();
		onSubmit( title );
	};

	return (
		<Modal
			title={ sprintf(
				// Translators: %s as template part area title ("Header", "Footer", etc.).
				__( 'Name and create your new %s' ),
				areaLabel.toLowerCase()
			) }
			closeLabel={ __( 'Cancel' ) }
			overlayClassName="wp-block-template-part__placeholder-create-new__title-form"
			onRequestClose={ onClose }
		>
			<form onSubmit={ submitForCreation }>
				<TextControl
					label={ __( 'Name' ) }
					value={ title }
					onChange={ setTitle }
				/>
				<Flex
					className="wp-block-template-part__placeholder-create-new__title-form-actions"
					justify="flex-end"
				>
					<FlexItem>
						<Button
							variant="primary"
							type="submit"
							disabled={ ! title.length }
							aria-disabled={ ! title.length }
						>
							{ __( 'Create' ) }
						</Button>
					</FlexItem>
				</Flex>
			</form>
		</Modal>
	);
}
