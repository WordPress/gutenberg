/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import CreateTemplatePartModal from '../create-template-part-modal';

export default function NewTemplatePart( { postType } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	async function createTemplatePart( { title, area } ) {
		if ( ! title ) {
			return;
		}

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

		// Wait for async navigation to happen before closing the modal.
		await new Promise( () => {} );
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
