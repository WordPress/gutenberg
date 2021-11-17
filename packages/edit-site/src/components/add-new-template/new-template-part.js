/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import CreateTemplatePartModal from '../create-template-part-modal';

export default function NewTemplatePart( { postType } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { saveEntityRecord } = useDispatch( coreStore );

	async function createTemplatePart( { title, area } ) {
		if ( ! title || ! area ) {
			return;
		}

		const templatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			{
				slug: kebabCase( title ),
				title,
				content: '',
				area,
			}
		);

		// Navigate to the created template part editor.
		window.location.search = addQueryArgs( '', {
			page: 'gutenberg-edit-site',
			postId: templatePart.id,
			postType: 'wp_template_part',
		} );
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
