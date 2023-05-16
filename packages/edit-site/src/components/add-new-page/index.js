/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	TextControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../private-apis';

const DEFAULT_TITLE = __( 'Untitled page' );

const { useHistory } = unlock( routerPrivateApis );

export default function AddNewPageModal() {
	const [ isCreatingPage, setIsCreatingPage ] = useState( false );
	const [ title, setTitle ] = useState( DEFAULT_TITLE );

	const history = useHistory();
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	const { isCreatePageModalOpen } = useSelect( ( select ) => {
		const { isCreatePageModalOpened } = unlock( select( editSiteStore ) );

		return {
			isCreatePageModalOpen: isCreatePageModalOpened(),
		};
	}, [] );

	const { setIsCreatePageModalOpened } = useDispatch( editSiteStore );

	const { setPage } = unlock( useDispatch( editSiteStore ) );

	async function createPage( event ) {
		event.preventDefault();

		if ( isCreatingPage ) {
			return;
		}
		setIsCreatingPage( true );
		try {
			const newPage = await saveEntityRecord(
				'postType',
				'page',
				{
					status: 'draft',
					title,
					slug: kebabCase( title || DEFAULT_TITLE ),
				},
				{ throwOnError: true }
			);

			if ( isCreatePageModalOpen.options?.redirectAfterSave ) {
				// Set template before navigating away to avoid initial stale value.
				setPage( {
					context: { postType: 'page', postId: newPage.id },
				} );
				// Navigate to the created template editor.
				history.push( {
					postId: newPage.id,
					postType: newPage.type,
					canvas: 'edit',
				} );
			}

			// Close the modal when complete
			setIsCreatePageModalOpened( false, { redirectAfterSave: false } );

			createSuccessNotice(
				sprintf(
					// translators: %s: Title of the created template e.g: "Category".
					__( '"%s" successfully created.' ),
					newPage.title?.rendered || title
				),
				{
					type: 'snackbar',
				}
			);
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the page.' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		} finally {
			setIsCreatingPage( false );
		}
	}

	const handleClose = () => {
		setIsCreatePageModalOpened( false );
	};

	if ( ! isCreatePageModalOpen.isOpen ) return null;

	return (
		<Modal title="Draft a new page" onRequestClose={ handleClose }>
			<form onSubmit={ createPage }>
				<VStack spacing={ 3 }>
					<TextControl
						help="You can always change this later"
						label="Page title"
						onChange={ setTitle }
						value={ title }
					/>
					<HStack spacing={ 2 } justify="end">
						<Button variant="tertiary" onClick={ handleClose }>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							type="submit"
							isBusy={ isCreatingPage }
							aria-disabled={ isCreatingPage }
						>
							{ __( 'Create draft' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
