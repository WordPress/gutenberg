/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { PanelBody } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { navigation, symbol } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import TemplateActions from './template-actions';
import TemplateAreas from './template-areas';
import LastRevision from './last-revision';
import SidebarCard from '../sidebar-card';
import PatternCategories from './pattern-categories';
import { PATTERN_TYPES } from '../../../utils/constants';

const CARD_ICONS = {
	wp_block: symbol,
	wp_navigation: navigation,
};

export default function TemplatePanel() {
	const { title, description, icon, record, postType } = useSelect(
		( select ) => {
			const { getEditedPostType, getEditedPostId } =
				select( editSiteStore );
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
				postType: type,
			};
		},
		[]
	);

	if ( ! title && ! description ) {
		return null;
	}

	return (
		<PanelBody className="edit-site-template-panel">
			<SidebarCard
				className="edit-site-template-card"
				title={ decodeEntities( title ) }
				icon={ CARD_ICONS[ record?.type ] ?? icon }
				description={ decodeEntities( description ) }
				actions={ <TemplateActions template={ record } /> }
			>
				<TemplateAreas />
			</SidebarCard>
			<LastRevision />
			{ postType === PATTERN_TYPES.user && (
				<PatternCategories post={ record } />
			) }
		</PanelBody>
	);
}
