/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useHistory } from '../routes';
import CreateTemplatePartModal from '../create-template-part-modal';

export default function NewTemplatePart( { postType } ) {
	const history = useHistory();
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { createErrorNotice } = useDispatch( noticesStore );
	const { throwingSaveEntityRecord } = useDispatch( coreStore );

	async function createTemplatePart( { title, area } ) {
		if ( ! title ) {
			createErrorNotice( __( 'Title is not defined.' ), {
				type: 'snackbar',
			} );
			return;
		}

		try {
			// Currently template parts only allow latin chars.
			// Fallback slug will receive suffix by default.
			const cleanSlug =
				kebabCase( title ).replace( /[^\w-]+/g, '' ) ||
				'wp-custom-part';

			const templatePart = await throwingSaveEntityRecord(
				'postType',
				'wp_template_part',
				{
					slug: cleanSlug,
					title,
					content: '',
					area,
				}
			);

			setIsModalOpen( false );

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
				variant="primary"
				onClick={ () => {
					setIsModalOpen( true );
				} }
			>
				{ postType.labels.add_new }
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
