/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useMemo, useState, useCallback } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';
import { MenuItem, Modal, Button, Flex, FlexItem } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useEntityRecord } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { parse } from '@wordpress/blocks';
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import { useAvailableTemplates, useEditedPostContext } from './hooks';

const modalContentMap = {
	templatesList: 1,
	confirmSwap: 2,
};

export default function SwapTemplateButton() {
	const [ selectedTemplate, setSelectedTemplate ] = useState();
	const [ showModal, setShowModal ] = useState( false );
	const [ modalContent, setModalContent ] = useState(
		modalContentMap.templatesList
	);
	const availableTemplates = useAvailableTemplates();
	const onClose = useCallback( () => {
		setShowModal( false );
		setModalContent( modalContentMap.templatesList );
	}, [] );
	const { postType, postId } = useEditedPostContext();
	const entitiy = useEntityRecord( 'postType', postType, postId );
	const { setPage } = useDispatch( editSiteStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	if ( ! availableTemplates?.length ) {
		return null;
	}
	const modalTitle =
		modalContent === modalContentMap.templatesList
			? __( 'Choose a template' )
			: sprintf(
					/* translators: The page's title. */
					__( 'Save "%s"?' ),
					decodeEntities( entitiy.record.title.rendered )
			  );
	const onConfirmSwap = async ( template ) => {
		entitiy.edit( { template: template.name }, { undoIgnore: true } );
		await entitiy.save();
		onClose();
		await setPage( {
			context: { postType, postId },
		} );
		createSuccessNotice(
			sprintf(
				/* translators: The page's title. */
				__( '"%s" applied.' ),
				decodeEntities( template.title )
			),
			{ type: 'snackbar' }
		);
	};
	return (
		<>
			<MenuItem onClick={ () => setShowModal( true ) }>
				{ __( 'Swap template' ) }
			</MenuItem>
			{ showModal && (
				<Modal
					title={ modalTitle }
					onRequestClose={ onClose }
					isFullScreen={
						modalContent === modalContentMap.templatesList
					}
				>
					{ modalContent === modalContentMap.templatesList && (
						<div className="edit-site-page-panels__swap-template__modal-content">
							<TemplatesList
								onSelect={ ( template ) => {
									setModalContent(
										modalContentMap.confirmSwap
									);
									setSelectedTemplate( template );
								} }
							/>
						</div>
					) }
					{ modalContent === modalContentMap.confirmSwap && (
						<>
							{ __(
								'Template swaps are published immediately.'
							) }
							<Flex
								className="edit-site-page-panels__swap-template__confirm-modal__actions"
								justify="flex-end"
								expanded={ false }
							>
								<FlexItem>
									<Button
										variant="tertiary"
										onClick={ onClose }
									>
										{ __( 'Cancel' ) }
									</Button>
								</FlexItem>
								<FlexItem>
									<Button
										variant="primary"
										type="submit"
										onClick={ () =>
											onConfirmSwap( selectedTemplate )
										}
									>
										{ __( 'Save' ) }
									</Button>
								</FlexItem>
							</Flex>
						</>
					) }
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
