/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';
import { MenuItem, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { useAsyncList } from '@wordpress/compose';
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';

export default function ReplaceTemplateButton( {
	onClick,
	availableTemplates,
} ) {
	const { editEntityRecord } = useDispatch( coreStore );
	const [ showModal, setShowModal ] = useState( false );
	const onClose = () => {
		setShowModal( false );
	};

	const { postId, postType } = useSelect( ( select ) => {
		return {
			postId: select( editSiteStore ).getEditedPostId(),
			postType: select( editSiteStore ).getEditedPostType(),
		};
	}, [] );

	const onTemplateSelect = async ( selectedTemplate ) => {
		onClose(); // Close the template suggestions modal first.
		onClick();
		await editEntityRecord( 'postType', postType, postId, {
			blocks: selectedTemplate.blocks,
			content: serialize( selectedTemplate.blocks ),
		} );
	};

	if ( ! availableTemplates.length || availableTemplates.length < 1 ) {
		return null;
	}

	return (
		<>
			<MenuItem
				info={ __(
					'Replace the contents of this template with another.'
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

	return (
		<BlockPatternsList
			label={ __( 'Templates' ) }
			blockPatterns={ availableTemplates }
			shownPatterns={ shownTemplates }
			onClickPattern={ onSelect }
		/>
	);
}
