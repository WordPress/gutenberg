/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Button,
	Modal,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplateActionsLoadingScreen from './template-actions-loading-screen';

function AddCustomGenericTemplateModal( {
	onClose,
	createTemplate,
	isCreatingTemplate,
} ) {
	const [ title, setTitle ] = useState( '' );
	const defaultTitle = __( 'Custom Template' );
	const [ isBusy, setIsBusy ] = useState( false );
	async function onCreateTemplate( event ) {
		event.preventDefault();
		if ( isBusy ) {
			return;
		}
		setIsBusy( true );
		try {
			await createTemplate(
				{
					slug:
						'wp-custom-template-' +
						kebabCase( title || defaultTitle ),
					title: title || defaultTitle,
				},
				false
			);
		} finally {
			setIsBusy( false );
		}
	}
	return (
		<Modal
			title={ __( 'Create custom template' ) }
			onRequestClose={ () => {
				onClose();
			} }
			overlayClassName="edit-site-custom-generic-template__modal"
		>
			{ isCreatingTemplate && <TemplateActionsLoadingScreen /> }
			<form onSubmit={ onCreateTemplate }>
				<VStack spacing={ 6 }>
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
						placeholder={ defaultTitle }
						disabled={ isBusy }
						help={ __(
							'Describe the template, e.g. "Post with sidebar".'
						) }
					/>
					<HStack
						className="edit-site-custom-generic-template__modal-actions"
						justify="right"
					>
						<Button
							variant="tertiary"
							onClick={ () => {
								onClose();
							} }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							type="submit"
							isBusy={ isBusy }
							aria-disabled={ isBusy }
						>
							{ __( 'Create' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}

export default AddCustomGenericTemplateModal;
