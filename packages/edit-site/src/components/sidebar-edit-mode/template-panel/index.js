/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
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

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import TemplateActions from './template-actions';
import TemplateAreas from './template-areas';
import SidebarCard from '../sidebar-card';

const CARD_ICONS = {
	wp_block: symbol,
	wp_navigation: navigation,
};

export default function TemplatePanel() {
	const { title, description, icon, record } = useSelect( ( select ) => {
		const { getEditedPostType, getEditedPostId } = select( editSiteStore );
		const { getEditedEntityRecord } = select( coreStore );
		const { __experimentalGetTemplateInfo: getTemplateInfo } =
			select( editorStore );

		const type = getEditedPostType();
		const postId = getEditedPostId();
		const _record = getEditedEntityRecord( 'postType', type, postId );
		const info = getTemplateInfo( _record );

		return {
			title: info.title,
			description: info.description,
			icon: info.icon,
			record: _record,
		};
	}, [] );

	if ( ! title && ! description ) {
		return null;
	}

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
