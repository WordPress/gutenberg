/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useMemo, useState, useCallback } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';
import { MenuItem, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecord } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import { useAvailableTemplates, useEditedPostContext } from './hooks';

export default function SwapTemplateButton( { onClick } ) {
	const [ showModal, setShowModal ] = useState( false );
	const availableTemplates = useAvailableTemplates();
	const onClose = useCallback( () => {
		setShowModal( false );
	}, [] );
	const { postType, postId } = useEditedPostContext();
	const entitiy = useEntityRecord( 'postType', postType, postId );
	const { setPage } = useDispatch( editSiteStore );
	if ( ! availableTemplates?.length ) {
		return null;
	}
	const onTemplateSelect = async ( template ) => {
		entitiy.edit( { template: template.name }, { undoIgnore: true } );
		onClose();
		onClick();
		await setPage( {
			context: { postType, postId },
		} );
	};
	return (
		<>
			<MenuItem onClick={ () => setShowModal( true ) }>
				{ __( 'Swap template' ) }
			</MenuItem>
			{ showModal && (
				<Modal
					title={ __( 'Choose a template' ) }
					onRequestClose={ onClose }
					isFullScreen
				>
					<div className="edit-site-page-panels__swap-template__modal-content">
						<TemplatesList onSelect={ onTemplateSelect } />
					</div>
				</Modal>
			) }
		</>
	);
}

function TemplatesList( { onSelect } ) {
	const availableTemplates = useAvailableTemplates();
	const templatesAsPatterns = useMemo(
		() =>
			availableTemplates.map( ( template ) => ( {
				name: template.slug,
				blocks: parse( template.content.raw ),
				title: decodeEntities( template.title.rendered ),
				id: template.id,
			} ) ),
		[ availableTemplates ]
	);
	const shownTemplates = useAsyncList( templatesAsPatterns );
	return (
		<BlockPatternsList
			label={ __( 'Templates' ) }
			blockPatterns={ templatesAsPatterns }
			shownPatterns={ shownTemplates }
			onClickPattern={ onSelect }
		/>
	);
}
