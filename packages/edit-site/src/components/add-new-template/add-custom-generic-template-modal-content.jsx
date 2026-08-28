/**
 * External dependencies
 */
import { paramCase as kebabCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, TextControl } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

function AddCustomGenericTemplateModalContent( { createTemplate, onBack } ) {
	const [ title, setTitle ] = useState( '' );
	const defaultTitle = __( 'Custom Template' );
	const [ isBusy, setIsBusy ] = useState( false );
	const inputRef = useRef();

	// Set focus to the name input when the component mounts
	useEffect( () => {
		if ( inputRef.current ) {
			inputRef.current.focus();
		}
	}, [] );

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
						kebabCase( title || defaultTitle ) ||
						'wp-custom-template',
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
			<Stack direction="column" gap="xl">
				<TextControl
					label={ __( 'Name' ) }
					value={ title }
					onChange={ setTitle }
					placeholder={ defaultTitle }
					disabled={ isBusy }
					ref={ inputRef }
					help={ __(
						// eslint-disable-next-line no-restricted-syntax -- 'sidebar' is a common web design term for layouts
						'Describe the template, e.g. "Post with sidebar". A custom template can be manually applied to any post or page.'
					) }
				/>
				<Stack
					direction="row"
					gap="sm"
					align="center"
					className="edit-site-custom-generic-template__modal-actions"
					justify="right"
				>
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ onBack }
					>
						{ __( 'Back' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						type="submit"
						isBusy={ isBusy }
						aria-disabled={ isBusy }
					>
						{ __( 'Create' ) }
					</Button>
				</Stack>
			</Stack>
		</form>
	);
}

export default AddCustomGenericTemplateModalContent;
