/**
 * External dependencies
 */
import { paramCase as kebabCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

function AddCustomGenericTemplateModalContent( { onClose, createTemplate } ) {
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
						'Describe the template, e.g. "Post with sidebar". A custom template can be manually applied to any post or page.'
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
	);
}

export default AddCustomGenericTemplateModalContent;
