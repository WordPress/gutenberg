/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	setDefaultBlockName,
	setFreeformContentHandlerName,
	setUnregisteredTypeHandlerName,
	setGroupingBlockName,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import * as archives from './archives';
import * as audio from './audio';
import * as button from './button';
import * as buttons from './buttons';
import * as calendar from './calendar';
import * as categories from './categories';
import * as classic from './freeform';
import * as code from './code';
import * as column from './column';
import * as columns from './columns';
import * as commentAuthorAvatar from './comment-author-avatar';
import * as commentAuthorName from './comment-author-name';
import * as commentContent from './comment-content';
import * as commentDate from './comment-date';
import * as commentEditLink from './comment-edit-link';
import * as commentReplyLink from './comment-reply-link';
import * as commentTemplate from './comment-template';
import * as commentsPaginationPrevious from './comments-pagination-previous';
import * as commentsQueryLoop from './comments-query-loop';
import * as commentsPagination from './comments-pagination';
import * as commentsPaginationNext from './comments-pagination-next';
import * as commentsPaginationNumbers from './comments-pagination-numbers';
import * as cover from './cover';
import * as embed from './embed';
import * as file from './file';
import * as gallery from './gallery';
import * as group from './group';
import * as heading from './heading';
import * as homeLink from './home-link';
import * as html from './html';
import * as image from './image';
import * as latestComments from './latest-comments';
import * as latestPosts from './latest-posts';
import * as list from './list';
import * as logInOut from './loginout';
import * as mediaText from './media-text';
import * as missing from './missing';
import * as more from './more';
import * as navigation from './navigation';
import * as navigationArea from './navigation-area';
import * as navigationLink from './navigation-link';
import * as navigationSubmenu from './navigation-submenu';
import * as nextpage from './nextpage';
import * as pattern from './pattern';
import * as pageList from './page-list';
import * as paragraph from './paragraph';
import * as postAuthor from './post-author';
import * as postAuthorName from './post-author-name';
import * as postAuthorBiography from './post-author-biography';
import * as postComment from './post-comment';
import * as postComments from './post-comments';
import * as postCommentsCount from './post-comments-count';
import * as postCommentsForm from './post-comments-form';
import * as postCommentsLink from './post-comments-link';
import * as postContent from './post-content';
import * as postDate from './post-date';
import * as postExcerpt from './post-excerpt';
import * as postFeaturedImage from './post-featured-image';
import * as postNavigationLink from './post-navigation-link';
import * as postTemplate from './post-template';
import * as postTerms from './post-terms';
import * as postTitle from './post-title';
import * as preformatted from './preformatted';
import * as pullquote from './pullquote';
import * as query from './query';
import * as queryPagination from './query-pagination';
import * as queryPaginationNext from './query-pagination-next';
import * as queryPaginationNumbers from './query-pagination-numbers';
import * as queryPaginationPrevious from './query-pagination-previous';
import * as queryTitle from './query-title';
import * as quote from './quote';
import * as reusableBlock from './block';
import * as readMore from './read-more';
import * as rss from './rss';
import * as search from './search';
import * as separator from './separator';
import * as shortcode from './shortcode';
import * as siteLogo from './site-logo';
import * as siteTagline from './site-tagline';
import * as siteTitle from './site-title';
import * as socialLink from './social-link';
import * as socialLinks from './social-links';
import * as spacer from './spacer';
import * as table from './table';
// Import * as tableOfContents from './table-of-contents';
import * as tagCloud from './tag-cloud';
import * as templatePart from './template-part';
import * as termDescription from './term-description';
import * as textColumns from './text-columns';
import * as verse from './verse';
import * as video from './video';

/**
 * Function to register an individual block.
 *
 * @param {Object} block The block to be registered.
 *
 */
const registerBlock = ( block ) => {
	if ( ! block ) {
		return;
	}
	const { metadata, settings, name } = block;
	registerBlockType( { name, ...metadata }, settings );
};

/**
 * Function to get all the core blocks in an array.
 *
 * @example
 * ```js
 * import { __experimentalGetCoreBlocks } from '@wordpress/block-library';
 *
 * const coreBlocks = __experimentalGetCoreBlocks();
 * ```
 */
export const __experimentalGetCoreBlocks = () => [
	// Common blocks are grouped at the top to prioritize their display
	// in various contexts — like the inserter and auto-complete components.
	paragraph,
	image,
	heading,
	gallery,
	list,
	quote,

	// Register all remaining core blocks.
	archives,
	audio,
	button,
	buttons,
	calendar,
	categories,
	window.wp && window.wp.oldEditor ? classic : null, // Only add the classic block in WP Context.
	code,
	column,
	columns,
	cover,
	embed,
	file,
	group,
	html,
	latestComments,
	latestPosts,
	mediaText,
	missing,
	more,
	nextpage,
	pageList,
	pattern,
	preformatted,
	pullquote,
	reusableBlock,
	rss,
	search,
	separator,
	shortcode,
	socialLink,
	socialLinks,
	spacer,
	table,
	// tableOfContents,
	tagCloud,
	textColumns,
	verse,
	video,

	// theme blocks
	navigation,
	navigationLink,
	navigationSubmenu,
	siteLogo,
	siteTitle,
	siteTagline,
	query,
	templatePart,
	postTitle,
	postExcerpt,
	postFeaturedImage,
	postContent,
	postAuthor,
	postDate,
	postTerms,
	postNavigationLink,
	postTemplate,
	queryPagination,
	queryPaginationNext,
	queryPaginationNumbers,
	queryPaginationPrevious,
	postComments,
	logInOut,
	termDescription,
	queryTitle,
	postAuthorName,
	postAuthorBiography,
];

/**
 * Function to register core blocks provided by the block editor.
 *
 * @param {Array} blocks An optional array of the core blocks being registered.
 *
 * @example
 * ```js
 * import { registerCoreBlocks } from '@wordpress/block-library';
 *
 * registerCoreBlocks();
 * ```
 */
export const registerCoreBlocks = (
	blocks = __experimentalGetCoreBlocks()
) => {
	blocks.forEach( registerBlock );

	setDefaultBlockName( paragraph.name );
	if ( window.wp && window.wp.oldEditor ) {
		setFreeformContentHandlerName( classic.name );
	}
	setUnregisteredTypeHandlerName( missing.name );
	setGroupingBlockName( group.name );
};

/**
 * Function to register experimental core blocks depending on editor settings.
 *
 * @param {boolean} enableFSEBlocks Whether to enable the full site editing blocks.
 * @example
 * ```js
 * import { __experimentalRegisterExperimentalCoreBlocks } from '@wordpress/block-library';
 *
 * __experimentalRegisterExperimentalCoreBlocks( settings );
 * ```
 */
export const __experimentalRegisterExperimentalCoreBlocks = process.env
	.IS_GUTENBERG_PLUGIN
	? ( { enableFSEBlocks } = {} ) => {
			[
				// Experimental blocks.
				homeLink,

				// Full Site Editing blocks.
				...( enableFSEBlocks
					? [
							commentAuthorAvatar,
							commentAuthorName,
							commentContent,
							commentDate,
							commentEditLink,
							commentReplyLink,
							commentTemplate,
							commentsQueryLoop,
							commentsPagination,
							commentsPaginationNext,
							commentsPaginationNumbers,
							commentsPaginationPrevious,
							navigationArea,
							postComment,
							postCommentsCount,
							postCommentsForm,
							postCommentsLink,
							readMore,
					  ]
					: [] ),
			].forEach( registerBlock );
	  }
	: undefined;
