/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	TextControl,
	Button,
	Modal,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

export default function TitleModal( { areaLabel, onClose, onSubmit } ) {
	// Restructure onCreate to set the blocks on local state.
	// Add modal to confirm title and trigger onCreate.
	const [ title, setTitle ] = useState( '' );

	const submitForCreation = ( event ) => {
		event.preventDefault();
		onSubmit( title );
	};

	return (
		<Modal
			title={ sprintf(
				// Translators: %s as template part area title ("Header", "Footer", etc.).
				__( 'Create new %s' ),
				areaLabel.toLowerCase()
			) }
			onRequestClose={ onClose }
			focusOnMount="firstContentElement"
			size="small"
		>
			<form onSubmit={ submitForCreation }>
				<VStack spacing="5">
					<TextControl
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
						placeholder={ __( 'Custom Template Part' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<HStack justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ () => {
								onClose();
								setTitle( '' );
							} }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							type="submit"
							accessibleWhenDisabled
							disabled={ ! title.length }
							__next40pxDefaultSize
						>
							{ __( 'Create' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
