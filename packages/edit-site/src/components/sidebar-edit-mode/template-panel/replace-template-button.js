/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';
import { MenuItem, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecord } from '@wordpress/core-data';
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';

export default function ReplaceTemplateButton( {
	onClick,
	availableTemplates,
} ) {
	const [ showModal, setShowModal ] = useState( false );
	const onClose = useCallback( () => {
		setShowModal( false );
	}, [] );

	const { postId, postType } = useSelect( ( select ) => {
		return {
			postId: select( editSiteStore ).getEditedPostId(),
			postType: select( editSiteStore ).getEditedPostType(),
		};
	}, [] );

	const entitiy = useEntityRecord( 'postType', postType, postId );

	const onTemplateSelect = async ( selectedTemplate ) => {
		// TODO - trigger a reload
		entitiy.edit( { content: selectedTemplate.content } );

		onClose(); // Close the template suggestions modal first.
		onClick();
	};
	return (
		<>
			<MenuItem
				info={ __(
					'Replace this template entirely with another like it.'
				) }
				onClick={ () => setShowModal( true ) }
			>
				{ __( 'Replace template' ) }
			</MenuItem>

			{ showModal && (
				<Modal
					title={ __( 'Choose a template' ) }
					onRequestClose={ onClose }
					overlayClassName="edit-site-template-panel__replace-template-modal"
					isFullScreen
				>
					<div className="edit-site-template-panel__replace-template-modal__content">
						<TemplatesList
							availableTemplates={ availableTemplates }
							onSelect={ onTemplateSelect }
						/>
					</div>
				</Modal>
			) }
		</>
	);
}

function TemplatesList( { availableTemplates, onSelect } ) {
	const shownTemplates = useAsyncList( availableTemplates );

	// TODO - make this use a grid layout.
	return (
		<BlockPatternsList
			label={ __( 'Templates' ) }
			blockPatterns={ availableTemplates }
			shownPatterns={ shownTemplates }
			onClickPattern={ onSelect }
		/>
	);
}
