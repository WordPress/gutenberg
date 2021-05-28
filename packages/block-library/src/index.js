/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/block-editor';
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
import * as paragraph from './paragraph';
import * as image from './image';
import * as heading from './heading';
import * as quote from './quote';
import * as gallery from './gallery';
import * as archives from './archives';
import * as audio from './audio';
import * as buttons from './buttons';
import * as button from './button';
import * as calendar from './calendar';
import * as categories from './categories';
import * as code from './code';
import * as columns from './columns';
import * as column from './column';
import * as cover from './cover';
import * as embed from './embed';
import * as file from './file';
import * as html from './html';
import * as mediaText from './media-text';
import * as navigation from './navigation';
import * as navigationLink from './navigation-link';
import * as homeLink from './home-link';
import * as latestComments from './latest-comments';
import * as latestPosts from './latest-posts';
import * as legacyWidget from './legacy-widget';
import * as logInOut from './loginout';
import * as list from './list';
import * as missing from './missing';
import * as more from './more';
import * as nextpage from './nextpage';
import * as pageList from './page-list';
import * as preformatted from './preformatted';
import * as pullquote from './pullquote';
import * as reusableBlock from './block';
import * as rss from './rss';
import * as search from './search';
import * as group from './group';
import * as separator from './separator';
import * as shortcode from './shortcode';
import * as spacer from './spacer';
import * as table from './table';
// import * as tableOfContents from './table-of-contents';
import * as textColumns from './text-columns';
import * as verse from './verse';
import * as video from './video';
import * as tagCloud from './tag-cloud';
import * as classic from './freeform';
import * as socialLinks from './social-links';
import * as socialLink from './social-link';

// Full Site Editing Blocks
import * as siteLogo from './site-logo';
import * as siteTagline from './site-tagline';
import * as siteTitle from './site-title';
import * as templatePart from './template-part';
import * as query from './query';
import * as queryLoop from './query-loop';
import * as queryTitle from './query-title';
import * as queryPagination from './query-pagination';
import * as queryPaginationNext from './query-pagination-next';
import * as queryPaginationNumbers from './query-pagination-numbers';
import * as queryPaginationPrevious from './query-pagination-previous';
import * as postNavigationLink from './post-navigation-link';
import * as postTitle from './post-title';
import * as postContent from './post-content';
import * as postAuthor from './post-author';
import * as postComment from './post-comment';
import * as postCommentAuthor from './post-comment-author';
import * as postCommentContent from './post-comment-content';
import * as postCommentDate from './post-comment-date';
import * as postComments from './post-comments';
import * as postCommentsCount from './post-comments-count';
import * as postCommentsForm from './post-comments-form';
import * as postCommentsLink from './post-comments-link';
import * as postDate from './post-date';
import * as postExcerpt from './post-excerpt';
import * as postFeaturedImage from './post-featured-image';
import * as postTerms from './post-terms';
import * as termDescription from './term-description';

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
	shortcode,
	archives,
	audio,
	button,
	buttons,
	calendar,
	categories,
	code,
	columns,
	column,
	cover,
	embed,
	file,
	group,
	window.wp && window.wp.oldEditor ? classic : null, // Only add the classic block in WP Context
	html,
	mediaText,
	latestComments,
	latestPosts,
	legacyWidget,
	missing,
	more,
	nextpage,
	pageList,
	preformatted,
	pullquote,
	rss,
	search,
	separator,
	reusableBlock,
	socialLinks,
	socialLink,
	spacer,
	table,
	// tableOfContents,
	tagCloud,
	textColumns,
	verse,
	video,

	// Theme blocks
	siteLogo,
	siteTagline,
	siteTitle,

	query,
	queryLoop,
	queryTitle,
	queryPagination,
	queryPaginationNext,
	queryPaginationNumbers,
	queryPaginationPrevious,

	postTitle,
	postContent,
	postDate,
	postExcerpt,
	postFeaturedImage,
	postTerms,

	logInOut,
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
export const __experimentalRegisterExperimentalCoreBlocks =
	process.env.GUTENBERG_PHASE === 2
		? ( { enableFSEBlocks } = {} ) => {
				[
					navigation,
					navigationLink,
					homeLink,

					// Register Full Site Editing Blocks.
					...( enableFSEBlocks
						? [
								templatePart,
								postAuthor,
								postComment,
								postCommentAuthor,
								postCommentContent,
								postCommentDate,
								postComments,
								postCommentsCount,
								postCommentsForm,
								postCommentsLink,
								postNavigationLink,
								termDescription,
						  ]
						: [] ),
				].forEach( registerBlock );
		  }
		: undefined;
