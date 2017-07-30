/**
 * WordPress dependencies
 */
import { Panel } from 'components';

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
import PostPermalink from '../post-permalink';

const panel = (
	<Panel>
		<PostStatus />
		<LastRevision />
		<PostTaxonomies />
		<FeaturedImage />
		<PostPermalink />
		<PostExcerpt />
		<DiscussionPanel />
		<PageAttributes />
		<TableOfContents />
	</Panel>
);

export default () => panel;
