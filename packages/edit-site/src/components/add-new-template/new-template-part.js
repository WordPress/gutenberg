/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useHistory } from '../routes';
import { store as editSiteStore } from '../../store';
import CreateTemplatePartModal from '../create-template-part-modal';
import {
	useExistingTemplateParts,
	getUniqueTemplatePartTitle,
	getCleanTemplatePartSlug,
} from '../../utils/template-part-create';
import { unlock } from '../../experiments';

export default function NewTemplatePart( {
	postType,
	showIcon = true,
	toggleProps,
} ) {
	const history = useHistory();
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { createErrorNotice } = useDispatch( noticesStore );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const existingTemplateParts = useExistingTemplateParts();

	async function createTemplatePart( { title, area } ) {
		if ( ! title ) {
			createErrorNotice( __( 'Title is not defined.' ), {
				type: 'snackbar',
			} );
			return;
		}

		try {
			const uniqueTitle = getUniqueTemplatePartTitle(
				title,
				existingTemplateParts
			);
			const cleanSlug = getCleanTemplatePartSlug( uniqueTitle );

			const templatePart = await saveEntityRecord(
				'postType',
				'wp_template_part',
				{
					slug: cleanSlug,
					title: uniqueTitle,
					content: '',
					area,
				},
				{ throwOnError: true }
			);

			setIsModalOpen( false );

			// Switch to edit mode.
			setCanvasMode( 'edit' );

			// Navigate to the created template part editor.
			history.push( {
				postId: templatePart.id,
				postType: templatePart.type,
			} );

			// TODO: Add a success notice?
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __(
							'An error occurred while creating the template part.'
					  );

			createErrorNotice( errorMessage, { type: 'snackbar' } );

			setIsModalOpen( false );
		}
	}

	return (
		<>
			<Button
				{ ...toggleProps }
				onClick={ () => {
					setIsModalOpen( true );
				} }
				icon={ showIcon ? plus : null }
				label={ postType.labels.add_new }
			>
				{ showIcon ? null : postType.labels.add_new }
			</Button>
			{ isModalOpen && (
				<CreateTemplatePartModal
					closeModal={ () => setIsModalOpen( false ) }
					onCreate={ createTemplatePart }
				/>
			) }
		</>
	);
}
