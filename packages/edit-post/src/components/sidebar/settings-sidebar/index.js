/**
 * WordPress dependencies
 */
import { BlockInspector } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SettingsHeader from '../settings-header';
import PostStatus from '../post-status';
import LastRevision from '../last-revision';
import PostTaxonomies from '../post-taxonomies';
import FeaturedImage from '../featured-image';
import PostExcerpt from '../post-excerpt';
import PostLink from '../post-link';
import DiscussionPanel from '../discussion-panel';
import PageAttributes from '../page-attributes';
import MetaBoxes from '../../meta-boxes';
import PluginDocumentSettingPanel from '../plugin-document-setting-panel';
import PluginSidebarEditPost from '../../sidebar/plugin-sidebar';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

const SettingsSidebar = () => {
	const sidebarName = useSelect(
		( select ) =>
			select( 'core/interface' ).getActiveComplementaryArea(
				'core/edit-post'
			),
		[]
	);
	if (
		! [ 'edit-post/document', 'edit-post/block' ].includes( sidebarName )
	) {
		return null;
	}
	return (
		<PluginSidebarEditPost
			complementaryAreaIdentifier={ sidebarName }
			header={ <SettingsHeader sidebarName={ sidebarName } /> }
			closeLabel={ __( 'Close settings' ) }
			headerClassName="edit-post-sidebar__panel-tabs"
			isPinnable={ false }
		>
			{ sidebarName === 'edit-post/document' && (
				<>
					<PostStatus />
					<PluginDocumentSettingPanel.Slot />
					<LastRevision />
					<PostLink />
					<PostTaxonomies />
					<FeaturedImage />
					<PostExcerpt />
					<DiscussionPanel />
					<PageAttributes />
					<MetaBoxes location="side" />
				</>
			) }
			{ sidebarName === 'edit-post/block' && <BlockInspector /> }
		</PluginSidebarEditPost>
	);
};

export default SettingsSidebar;
