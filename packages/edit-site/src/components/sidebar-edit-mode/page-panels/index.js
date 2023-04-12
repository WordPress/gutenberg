/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalVStack as VStack,
	Button,
} from '@wordpress/components';
import { page as pageIcon } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityRecord } from '@wordpress/core-data';
import {
	store as blockEditorStore,
	BlockIcon,
	BlockContextProvider,
	BlockPreview,
} from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import useEditedEntityRecord from '../../use-edited-entity-record';
import removePageFromBlockContext from '../../../utils/remove-page-from-block-context';
import SidebarCard from '../sidebar-card';

export default function PagePanels() {
	const { context, contentBlocks, selectedBlockClientId } = useSelect(
		( select ) => {
			const { getEditedPostContext } = select( editSiteStore );
			const {
				getSettings,
				getClientIdsWithDescendants,
				getBlockName,
				getSelectedBlockClientId,
			} = select( blockEditorStore );
			const { contentBlockTypes } = getSettings();
			return {
				context: getEditedPostContext(),
				contentBlocks: getClientIdsWithDescendants()
					.map( ( clientId ) => ( {
						clientId,
						blockName: getBlockName( clientId ),
					} ) )
					.filter( ( { blockName } ) =>
						contentBlockTypes.includes( blockName )
					),
				selectedBlockClientId: getSelectedBlockClientId(),
			};
		},
		[]
	);

	const { hasResolved: hasPageResolved, editedRecord: page } =
		useEntityRecord( 'postType', context.postType, context.postId );

	const {
		isLoaded: isTemplateLoaded,
		getTitle: getTemplateTitle,
		record: template,
	} = useEditedEntityRecord();

	const { selectBlock } = useDispatch( blockEditorStore );
	const { togglePageContentLock } = useDispatch( editSiteStore );

	const blockContext = useMemo(
		() => removePageFromBlockContext( context ),
		[ context ]
	);

	if ( ! hasPageResolved || ! isTemplateLoaded ) {
		return null;
	}

	return (
		<>
			<PanelBody>
				<SidebarCard
					title={ page.title }
					icon={ pageIcon }
					description={ sprintf(
						// translators: %s: Human-readable time difference, e.g. "2 days ago".
						__( 'Last edited %s' ),
						humanTimeDiff( page.modified )
					) }
				/>
			</PanelBody>
			{ /* TODO: DRY this with BlockInspectorLockedBlocks. */ }
			<PanelBody title={ __( 'Content' ) }>
				<VStack>
					{ contentBlocks.map( ( { clientId, blockName } ) => {
						const blockType = getBlockType( blockName );
						return (
							<Button
								key={ clientId }
								icon={ <BlockIcon icon={ blockType.icon } /> }
								isPressed={ clientId === selectedBlockClientId }
								onClick={ () => selectBlock( clientId ) }
							>
								{ blockType.title }
							</Button>
						);
					} ) }
				</VStack>
			</PanelBody>
			<PanelBody
				className="edit-site-edit-template-panel"
				title={ __( 'Template' ) }
			>
				<VStack>
					<div>{ getTemplateTitle() }</div>
					<div className="edit-site-edit-template-panel__preview">
						<BlockContextProvider value={ blockContext }>
							<BlockPreview
								viewportWidth={ 1024 }
								blocks={ template.blocks }
							/>
						</BlockContextProvider>
					</div>
					<Button
						className="edit-site-edit-template-panel__button"
						variant="secondary"
						onClick={ () => togglePageContentLock() }
					>
						{ __( 'Edit template' ) }
					</Button>
				</VStack>
			</PanelBody>
		</>
	);
}
