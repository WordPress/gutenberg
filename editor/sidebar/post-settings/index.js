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

const panel = (
	<Panel>
		<PostStatus />
		<LastRevision />
		<PostTaxonomies />
		<FeaturedImage />
		<PostExcerpt />
		<DiscussionPanel />
		<PageAttributes />
		<DocumentOutlinePanel />
		<MetaBoxes location="side" />
	</Panel>
);

export default () => panel;
