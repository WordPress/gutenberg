/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { Modal, Button, SearchControl } from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';
import {
	useAvailableTemplates,
	useEditedPostContext,
} from '../post-template/hooks';
import { searchTemplates } from '../../utils/search-templates';

export default function BlockThemeControlV2( { id } ) {
	const { editedRecord: template, hasResolved } = useEntityRecord(
		'postType',
		'wp_template',
		id
	);

	const { postType, postId } = useEditedPostContext();
	const availableTemplates = useAvailableTemplates( postType );
	const { editEntityRecord } = useDispatch( coreStore );

	const [ showModal, setShowModal ] = useState( false );
	if ( ! hasResolved ) {
		return null;
	}

	const onTemplateSelect = ( selectedTemplate ) => {
		editEntityRecord(
			'postType',
			postType,
			postId,
			{ template: selectedTemplate.name },
			{ undoIgnore: true }
		);
		setShowModal( false );
	};

	return (
		<PostPanelRow label={ __( 'Template' ) }>
			<Button
				__next40pxDefaultSize
				disabled={ ! availableTemplates?.length }
				accessibleWhenDisabled
				label={ __( 'Change template' ) }
				size="compact"
				variant="tertiary"
				tooltipPosition="middle left"
				onClick={ () => {
					setShowModal( true );
				} }
			>
				{ decodeEntities( template.title ) }
			</Button>
			{ showModal && (
				<Modal
					title={ __( 'Choose a template' ) }
					onRequestClose={ () => setShowModal( false ) }
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
			) }
		</PostPanelRow>
	);
}

function TemplatesList( { postType, onSelect } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const availableTemplates = useAvailableTemplates( postType );
	const templatesAsPatterns = useMemo(
		() =>
			availableTemplates.map( ( t ) => ( {
				name: t.slug,
				blocks: parse( t.content.raw ),
				title: decodeEntities( t.title.rendered ),
				id: t.id,
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
