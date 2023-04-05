/**
 * WordPress dependencies
 */
import {
	Icon,
	PanelBody,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	Button,
} from '@wordpress/components';
import { page as pageIcon } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityRecord } from '@wordpress/core-data';
import { humanTimeDiff } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import {
	BlockContextProvider,
	BlockPreview,
	store as blockEditorStore,
	BlockIcon,
} from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import useEditedEntityRecord from '../../use-edited-entity-record';

const POST_CONTENT_BLOCK_NAMES = [
	'core/post-featured-image',
	'core/post-title',
	'core/post-content',
];

export default function PagePanels() {
	const { postBlocks, blockContext } = useSelect( ( select ) => {
		const { getClientIdsWithDescendants, getBlockName } =
			select( blockEditorStore );
		const { getEditedPostContext } = select( editSiteStore );
		return {
			postBlocks: getClientIdsWithDescendants()
				.map( ( clientId ) => ( {
					clientId,
					blockName: getBlockName( clientId ),
				} ) )
				.filter( ( { blockName } ) =>
					POST_CONTENT_BLOCK_NAMES.includes( blockName )
				),
			blockContext: getEditedPostContext(),
		};
	}, [] );
	const { postType, postId, ...nonPostFields } = blockContext;
	const previewBlockContext = {
		...nonPostFields,
		postType: null,
		postId: null,
	};
	const { hasResolved: hasPostResolved, editedRecord: post } =
		useEntityRecord( 'postType', postType, postId );
	const {
		isLoaded: isTemplateLoaded,
		getTitle: getTemplateTitle,
		record: template,
	} = useEditedEntityRecord();

	const { setEditFocus } = useDispatch( editSiteStore );
	const { selectBlock } = useDispatch( blockEditorStore );

	if ( ! hasPostResolved && ! isTemplateLoaded ) {
		return;
	}

	// TODO: split this up into multiple components
	return (
		<>
			<PanelBody>
				<div className="edit-site-template-card">
					<Icon
						className="edit-site-template-card__icon"
						icon={ pageIcon }
					/>
					<div className="edit-site-template-card__content">
						<div className="edit-site-template-card__header">
							<h2 className="edit-site-template-card__title">
								{ post.title }
							</h2>
						</div>
						<div
							className="edit-site-template-card__description"
							style={ { margin: 'unset' } }
						>
							{ sprintf(
								// translators: %s: Human-readable time difference, e.g. "2 days ago".
								__( 'Last edited %s' ),
								humanTimeDiff( post.modified )
							) }
						</div>
					</div>
				</div>
			</PanelBody>
			<PanelBody title={ __( 'Content' ) }>
				<VStack>
					{ postBlocks.map( ( { clientId, blockName } ) => {
						const blockType = getBlockType( blockName );
						return (
							<Button
								key={ clientId }
								icon={ <BlockIcon icon={ blockType.icon } /> }
								onClick={ () => selectBlock( clientId ) }
							>
								{ blockType.title }
							</Button>
						);
					} ) }
				</VStack>
			</PanelBody>
			<PanelBody title={ __( 'Template' ) }>
				<VStack>
					<HStack>
						<div>{ getTemplateTitle() }</div>
						{ /* TODO: REST API doesn't readily have this information */ }
						<div style={ { color: '#949494' } }>
							Used on 4 pages
						</div>
					</HStack>
					<div
						style={ {
							border: '1px solid #e0e0e0',
							maxHeight: 200,
							overflow: 'hidden',
						} }
					>
						<BlockContextProvider value={ previewBlockContext }>
							<BlockPreview
								viewportWidth={ 1024 }
								blocks={ template.blocks }
							/>
						</BlockContextProvider>
					</div>
					<Button
						variant="secondary"
						style={ { justifyContent: 'center' } }
						onClick={ () => setEditFocus( 'template' ) }
					>
						{ __( 'Edit template' ) }
					</Button>
				</VStack>
			</PanelBody>
		</>
	);
}
