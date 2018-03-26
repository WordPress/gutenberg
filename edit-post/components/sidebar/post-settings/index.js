/**
 * WordPress dependencies
 */
import { Panel } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostStatus from '../post-status';
import PostExcerpt from '../post-excerpt';
import PostTaxonomies from '../post-taxonomies';
import FeaturedImage from '../featured-image';
import DiscussionPanel from '../discussion-panel';
import LastRevision from '../last-revision';
import PageAttributes from '../page-attributes';
import DocumentOutlinePanel from '../document-outline-panel';
import MetaBoxes from '../../meta-boxes';
import PostsList from '../posts-list';
import SettingsPanel from '../settings-panel';

import { getPanelItems } from '../panel-items.js';

const items = getPanelItems();

const panel = () => {
	return (
		<Panel>
			{ items.includes('post-status') ? <PostStatus /> : '' }
			{ items.includes('post-excerpt') ? <LastRevision /> : '' }
			{ items.includes('post-taxonomies') ? <PostTaxonomies /> : '' }
			{ items.includes('featured-image') ? <FeaturedImage /> : '' }
			{ items.includes('discussion-panel') ? <PostExcerpt /> : '' }
			{ items.includes('last-revision') ? <DiscussionPanel /> : '' }
			{ items.includes('page-attributes') ? <PageAttributes /> : '' }
			{ items.includes('document-outline-panel') ? <DocumentOutlinePanel /> : '' }
			{ items.includes('meta-boxes') ? <MetaBoxes location="side" usePanel /> : '' }
			{ items.includes('posts-list') ? <PostsList /> : '' }
			{ items.includes('settings-panel') ? <SettingsPanel /> : '' }
		</Panel>
	);
}

export default panel;
