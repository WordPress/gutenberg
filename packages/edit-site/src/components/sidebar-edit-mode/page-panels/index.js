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
import { BlockContextProvider, BlockPreview } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import useEditedEntityRecord from '../../use-edited-entity-record';
import SidebarCard from '../sidebar-card';
import PageContent from './page-content';

export default function PagePanels() {
	const context = useSelect(
		( select ) => select( editSiteStore ).getEditedPostContext(),
		[]
	);

	const { hasResolved: hasPageResolved, editedRecord: page } =
		useEntityRecord( 'postType', context.postType, context.postId );

	const {
		isLoaded: isTemplateLoaded,
		getTitle: getTemplateTitle,
		record: template,
	} = useEditedEntityRecord();

	const { setHasPageContentFocus } = useDispatch( editSiteStore );

	const blockContext = useMemo(
		() => ( { ...context, postType: null, postId: null } ),
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
			<PanelBody title={ __( 'Content' ) }>
				<PageContent />
			</PanelBody>
			<PanelBody title={ __( 'Template' ) }>
				<VStack>
					<div>{ getTemplateTitle() }</div>
					<div className="edit-site-page-panels__edit-template-preview">
						<BlockContextProvider value={ blockContext }>
							<BlockPreview
								viewportWidth={ 1024 }
								blocks={ template.blocks }
							/>
						</BlockContextProvider>
					</div>
					<Button
						className="edit-site-page-panels__edit-template-button"
						variant="secondary"
						onClick={ () => setHasPageContentFocus( false ) }
					>
						{ __( 'Edit template' ) }
					</Button>
				</VStack>
			</PanelBody>
		</>
	);
}
