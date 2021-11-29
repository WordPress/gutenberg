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
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import CreateTemplatePartModal from '../create-template-part-modal';

export default function NewTemplatePart( { postType } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { createErrorNotice } = useDispatch( noticesStore );

	async function createTemplatePart( { title, area } ) {
		if ( ! title ) {
			createErrorNotice( __( 'Title is not defined.' ), {
				type: 'snackbar',
			} );
			return;
		}

		try {
			const templatePart = await apiFetch( {
				path: '/wp/v2/template-parts',
				method: 'POST',
				data: {
					slug: kebabCase( title ),
					title,
					content: '',
					area,
				},
			} );

			// Navigate to the created template part editor.
			window.location.href = addQueryArgs( window.location.href, {
				postId: templatePart.id,
				postType: 'wp_template_part',
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __(
							'An error occurred while creating the template part.'
					  );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
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
