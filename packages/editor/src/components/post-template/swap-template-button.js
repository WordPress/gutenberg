/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';
import { MenuItem, Modal, SearchControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useAvailableTemplates, useEditedPostContext } from './hooks';
import { searchTemplates } from '../../utils/search-templates';

export function SwapTemplateModal( { onRequestClose, onSelect } ) {
	const { postType, postId } = useEditedPostContext();
	const { editEntityRecord } = useDispatch( coreStore );
	const onTemplateSelect = async ( template ) => {
		editEntityRecord(
			'postType',
			postType,
			postId,
			{ template: template.name },
			{ undoIgnore: true }
		);
		onRequestClose();
		onSelect?.();
	};
	return (
		<Modal
			title={ __( 'Choose a template' ) }
			onRequestClose={ onRequestClose }
			overlayClassName="editor-post-template__swap-template-modal"
			isFullScreen
		>
			<div className="editor-post-template__swap-template-modal-content">
				<TemplatesList
					postType={ postType }
					onSelect={ onTemplateSelect }
				/>
			</div>
		</Modal>
	);
}

export default function SwapTemplateButton( { onClick } ) {
	const [ showModal, setShowModal ] = useState( false );
	const { postType } = useEditedPostContext();
	const availableTemplates = useAvailableTemplates( postType );

	return (
		<>
			<MenuItem
				disabled={ ! availableTemplates?.length }
				accessibleWhenDisabled
				onClick={ () => setShowModal( true ) }
			>
				{ __( 'Change template' ) }
			</MenuItem>
			{ showModal && (
				<SwapTemplateModal
					onRequestClose={ () => setShowModal( false ) }
					onSelect={ onClick }
				/>
			) }
		</>
	);
}

function TemplatesList( { postType, onSelect } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const availableTemplates = useAvailableTemplates( postType );
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

	const filteredBlockTemplates = useMemo( () => {
		return searchTemplates( templatesAsPatterns, searchValue );
	}, [ templatesAsPatterns, searchValue ] );

	return (
		<>
			<SearchControl
				onChange={ setSearchValue }
				value={ searchValue }
				label={ __( 'Search' ) }
				placeholder={ __( 'Search' ) }
				className="editor-post-template__swap-template-search"
			/>
			<BlockPatternsList
				label={ __( 'Templates' ) }
				blockPatterns={ filteredBlockTemplates }
				onClickPattern={ onSelect }
			/>
		</>
	);
}
