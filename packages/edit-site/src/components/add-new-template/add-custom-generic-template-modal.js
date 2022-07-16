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
	Flex,
	FlexItem,
	Modal,
	TextControl,
} from '@wordpress/components';

function AddCustomGenericTemplateModal( { onClose, createTemplate } ) {
	const [ title, setTitle ] = useState( '' );
	const defaultTitle = __( 'Custom Template' );
	const [ isBusy, setIsBusy ] = useState( false );
	async function onCreateTemplate( event ) {
		event.preventDefault();

		if ( isBusy ) {
			return;
		}

		setIsBusy( true );

		createTemplate(
			{
				slug:
					'wp-custom-template-' + kebabCase( title || defaultTitle ),
				title: title || defaultTitle,
			},
			false
		);
	}
	return (
		<Modal
			title={ __( 'Create custom template' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ () => {
				onClose();
			} }
			overlayClassName="edit-site-custom-generic-template__modal"
		>
			<form onSubmit={ onCreateTemplate }>
				<Flex align="flex-start" gap={ 8 }>
					<FlexItem>
						<TextControl
							label={ __( 'Name' ) }
							value={ title }
							onChange={ setTitle }
							placeholder={ defaultTitle }
							disabled={ isBusy }
							help={ __(
								'Describe the template, e.g. "Post with sidebar".'
							) }
						/>
					</FlexItem>
				</Flex>

				<Flex
					className="edit-site-custom-generic-template__modal-actions"
					justify="flex-end"
					expanded={ false }
				>
					<FlexItem>
						<Button
							variant="tertiary"
							onClick={ () => {
								onClose();
							} }
						>
							{ __( 'Cancel' ) }
						</Button>
					</FlexItem>
					<FlexItem>
						<Button
							variant="primary"
							type="submit"
							isBusy={ isBusy }
							aria-disabled={ isBusy }
						>
							{ __( 'Create' ) }
						</Button>
					</FlexItem>
				</Flex>
			</form>
		</Modal>
	);
}

export default AddCustomGenericTemplateModal;
