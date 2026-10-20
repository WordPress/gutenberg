import type { FormEvent } from 'react';
import { Button } from '@wordpress/components';
import { CheckboxControl, InputControl, Notice, Stack } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { useState } from '@wordpress/element';
import { LinkUIPane } from './pane';
import type { LinkControlValue } from '../link-control/types';
import type { LinkUICreatePage } from './types';

interface LinkUIPageCreatorProps {
	onBack: () => void;
	onCreatePage: LinkUICreatePage;
	onPageCreated: ( page: LinkControlValue ) => void;
	initialTitle?: string;
}

/**
 * The message of a rejection, when it carries one. A REST error is a plain
 * object with a `message`, not an `Error`.
 *
 * @param error What the page creation rejected with.
 * @return The message, or null when there is none to show.
 */
function getErrorMessage( error: unknown ) {
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string' &&
		error.message
	) {
		return error.message;
	}
	return null;
}

/**
 * The form that creates a page and links to it.
 */
export function LinkUIPageCreator( {
	onBack,
	onCreatePage,
	onPageCreated,
	initialTitle = '',
}: LinkUIPageCreatorProps ) {
	const [ title, setTitle ] = useState( initialTitle );
	const [ shouldPublish, setShouldPublish ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState< string | null >( null );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const isTitleValid = title.trim().length > 0;

	async function createPage( event: FormEvent ) {
		event.preventDefault();
		if ( isSaving || ! isTitleValid ) {
			return;
		}

		setIsSaving( true );
		setErrorMessage( null );

		let page: LinkControlValue;
		try {
			page = await onCreatePage( { title, publish: shouldPublish } );
		} catch ( error ) {
			setIsSaving( false );
			setErrorMessage( getErrorMessage( error ) );
			createErrorNotice(
				__( 'Failed to create page. Please try again.' ),
				{
					type: 'snackbar',
					id: 'page-created-error',
				}
			);
			return;
		}

		setIsSaving( false );
		createSuccessNotice(
			sprintf(
				// translators: %s: the name of the new page being created.
				__( '%s page created successfully.' ),
				page.title ?? ''
			),
			{
				type: 'snackbar',
				id: 'page-created-success',
			}
		);
		onPageCreated( page );
	}

	const isSubmitDisabled = isSaving || ! isTitleValid;

	return (
		<LinkUIPane
			className="block-editor-link-ui-page-creator"
			title={ __( 'Create page' ) }
			description={ __( 'Create a new page to link to.' ) }
			onBack={ onBack }
		>
			<form
				className="block-editor-link-ui-page-creator__inner"
				onSubmit={ createPage }
			>
				<Stack direction="column" gap="lg">
					<InputControl
						label={ __( 'Title' ) }
						onValueChange={ setTitle }
						placeholder={ __( 'No title' ) }
						value={ title }
					/>

					<CheckboxControl
						label={ __( 'Publish' ) }
						description={ __(
							"Turn off to save as a draft. Drafts won't appear on your site until published."
						) }
						checked={ shouldPublish }
						onCheckedChange={ setShouldPublish }
					/>

					{ errorMessage && (
						<Notice.Root intent="error">
							<Notice.Description>
								{ errorMessage }
							</Notice.Description>
						</Notice.Root>
					) }

					<Stack direction="row" gap="sm" justify="flex-end">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ onBack }
							disabled={ isSaving }
							accessibleWhenDisabled
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
							isBusy={ isSaving }
							aria-disabled={ isSubmitDisabled }
						>
							{ __( 'Create page' ) }
						</Button>
					</Stack>
				</Stack>
			</form>
		</LinkUIPane>
	);
}
