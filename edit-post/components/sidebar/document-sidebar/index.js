/**
 * WordPress dependencies
 */
import { Panel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import PostStatus from '../post-status';
import PostExcerpt from '../post-excerpt';
import PostTaxonomies from '../post-taxonomies';
import FeaturedImage from '../featured-image';
import DiscussionPanel from '../discussion-panel';
import LastRevision from '../last-revision';
import PageAttributes from '../page-attributes';
import DocumentOutlinePanel from '../document-outline-panel';
import MetaBoxes from '../../meta-boxes';
import SettingsHeader from '../settings-header';
import Sidebar from '../';
import ArticlesPanel from '../articles-panel';
import SettingsPanel from '../settings-panel';

import { getPanelItems } from '../panel-items.js';

const items = getPanelItems();

const SIDEBAR_NAME = 'edit-post/document';

const DocumentSidebar = () => (
	<Sidebar
		name={ SIDEBAR_NAME }
		label={ __( 'Editor settings' ) }
	>
		<SettingsHeader sidebarName={ SIDEBAR_NAME } />
		<Panel>
			{ items.includes( 'post-status' ) ? <PostStatus /> : '' }
			{ items.includes( 'articles-panel' ) ? <ArticlesPanel /> : '' }
			{ items.includes( 'settings-panel' ) ? <SettingsPanel /> : '' }
			{ items.includes( 'last-revision' ) ? <LastRevision /> : '' }
			{ items.includes( 'post-taxonomies' ) ? <PostTaxonomies /> : '' }
			{ items.includes( 'featured-image' ) ? <FeaturedImage /> : '' }
			{ items.includes( 'post-excerpt' ) ? <PostExcerpt /> : '' }
			{ items.includes( 'discussion-panel' ) ? <DiscussionPanel /> : '' }
			{ items.includes( 'page-attributes' ) ? <PageAttributes /> : '' }
			{ items.includes( 'document-outline-panel' ) ? <DocumentOutlinePanel /> : '' }
			{ items.includes( 'meta-boxes' ) ? <MetaBoxes location="side" usePanel /> : '' }
		</Panel>
	</Sidebar>
);

export default DocumentSidebar;
