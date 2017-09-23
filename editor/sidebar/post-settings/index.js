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
import TableOfContents from '../table-of-contents';
import PageAttributes from '../page-attributes';

const panel = (
	<Panel>
		<PostStatus />
		<LastRevision />
		<PostTaxonomies />
		<FeaturedImage />
		<PostExcerpt />
		<DiscussionPanel />
		<PageAttributes />
		<TableOfContents />
	</Panel>
);

export default () => panel;
