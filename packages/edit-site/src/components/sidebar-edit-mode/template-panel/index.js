/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { PanelBody } from '@wordpress/components';
import {
	PageAttributesPanel,
	PostDiscussionPanel,
	PostExcerptPanel,
	PostFeaturedImagePanel,
	PostLastRevisionPanel,
	PostTaxonomiesPanel,
	store as editorStore,
} from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { navigation, symbol } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useAsyncList } from '@wordpress/compose';
import { serialize } from '@wordpress/blocks';
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import TemplateActions from './template-actions';
import TemplateAreas from './template-areas';
import SidebarCard from '../sidebar-card';
import { useAvailablePatterns } from './hooks';

const CARD_ICONS = {
	wp_block: symbol,
	wp_navigation: navigation,
};

function TemplatesList( { availableTemplates, onSelect } ) {
	const shownTemplates = useAsyncList( availableTemplates );
	if ( ! availableTemplates || availableTemplates?.length < 2 ) {
		return null;
	}

	return (
		<BlockPatternsList
			label={ __( 'Templates' ) }
			blockPatterns={ availableTemplates }
			shownPatterns={ shownTemplates }
			onClickPattern={ onSelect }
			showTitlesAsTooltip={ true }
		/>
	);
}

export default function TemplatePanel() {
	const { title, description, icon, record, postType, postId } = useSelect(
		( select ) => {
			const { getEditedPostType, getEditedPostId } =
				select( editSiteStore );
			const { getEditedEntityRecord } = select( coreStore );
			const { __experimentalGetTemplateInfo: getTemplateInfo } =
				select( editorStore );

			const type = getEditedPostType();
			const _postId = getEditedPostId();
			const _record = getEditedEntityRecord( 'postType', type, _postId );
			const info = getTemplateInfo( _record );

			return {
				title: info.title,
				description: info.description,
				icon: info.icon,
				record: _record,
				postType: type,
				postId: _postId,
			};
		},
		[]
	);

	const availablePatterns = useAvailablePatterns( record );
	const { editEntityRecord } = useDispatch( coreStore );

	if ( ! title && ! description ) {
		return null;
	}

	const onTemplateSelect = async ( selectedTemplate ) => {
		await editEntityRecord( 'postType', postType, postId, {
			blocks: selectedTemplate.blocks,
			content: serialize( selectedTemplate.blocks ),
		} );
	};

	return (
		<>
			<PanelBody>
				<SidebarCard
					className="edit-site-template-card"
					title={ decodeEntities( title ) }
					icon={ CARD_ICONS[ record?.type ] ?? icon }
					description={ decodeEntities( description ) }
					actions={ <TemplateActions template={ record } /> }
				>
					<TemplateAreas />
				</SidebarCard>
				<SidebarCard
					className="edit-site-template-card__templates-list"
					title={ __( 'Transform into:' ) }
				>
					<p>
						{ __(
							'Choose a predefined pattern to switch up the look of your template.' // TODO - make this dynamic?
						) }
					</p>
					<TemplatesList
						availableTemplates={ availablePatterns }
						onSelect={ onTemplateSelect }
					/>
				</SidebarCard>
			</PanelBody>
			<PostLastRevisionPanel />
			<PostTaxonomiesPanel />
			<PostFeaturedImagePanel />
			<PostExcerptPanel />
			<PostDiscussionPanel />
			<PageAttributesPanel />
		</>
	);
}
