/**
 * WordPress dependencies
 */
import {
	setDefaultBlockName,
	setFreeformContentHandlerName,
	setUnregisteredTypeHandlerName,
	setGroupingBlockName,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
// When IS_GUTENBERG_PLUGIN is set to false, imports of experimental blocks
// are transformed by packages/block-library/src/index.js as follows:
//    import * as experimentalBlock from './experimental-block'
// becomes
//    const experimentalBlock = null;
// This enables webpack to eliminate the experimental blocks code from the
// production build to make the final bundle smaller.
//
// See https://github.com/WordPress/gutenberg/pull/40655 for more context.
import * as archives from './archives';
import * as avatar from './avatar';
import * as audio from './audio';
import * as calendar from './calendar';
import * as categories from './categories';
import * as classic from './freeform';
import * as code from './code';
import * as comments from './comments';
import * as commentAuthorAvatar from './comment-author-avatar';
import * as commentAuthorName from './comment-author-name';
import * as commentContent from './comment-content';
import * as commentDate from './comment-date';
import * as commentEditLink from './comment-edit-link';
import * as commentReplyLink from './comment-reply-link';
import * as commentsTitle from './comments-title';
import * as cover from './cover';
import * as embed from './embed';
import * as file from './file';
import * as group from './group';
import * as heading from './heading';
import * as html from './html';
import * as latestComments from './latest-comments';
import * as latestPosts from './latest-posts';
import * as list from './list';
import * as listItem from './list-item';
import * as logInOut from './loginout';
import * as mediaText from './media-text';
import * as missing from './missing';
import * as more from './more';
import * as pattern from './pattern';
import * as paragraph from './paragraph';
import * as postAuthor from './post-author';
import * as postAuthorName from './post-author-name';
import * as postAuthorBiography from './post-author-biography';
import * as postComment from './post-comment';
import * as postCommentsCount from './post-comments-count';
import * as postCommentsForm from './post-comments-form';
import * as postCommentsLink from './post-comments-link';
import * as postDate from './post-date';
import * as postExcerpt from './post-excerpt';
import * as postFeaturedImage from './post-featured-image';
import * as postNavigationLink from './post-navigation-link';
import * as postTerms from './post-terms';
import * as postTimeToRead from './post-time-to-read';
import * as postTitle from './post-title';
import * as preformatted from './preformatted';
import * as pullquote from './pullquote';
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
import * as spacer from './spacer';
import * as table from './table';
import * as tableOfContents from './table-of-contents';
import * as tagCloud from './tag-cloud';
import * as templatePart from './template-part';
import * as termDescription from './term-description';
import * as textColumns from './text-columns';
import * as verse from './verse';
import * as video from './video';

import isBlockMetadataExperimental from './utils/is-block-metadata-experimental';

/**
 * Function to get all the block-library blocks in an array
 */
const getAllBlocks = () =>
	[
		// Common blocks are grouped at the top to prioritize their display
		// in various contexts — like the inserter and auto-complete components.
		paragraph,
		heading,
		list,
		listItem,
		quote,

		// Register all remaining core blocks.
		archives,
		audio,
		calendar,
		categories,
		...( window.wp && window.wp.oldEditor ? [ classic ] : [] ), // Only add the classic block in WP Context.
		code,
		commentAuthorAvatar,
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
		pattern,
		preformatted,
		pullquote,
		reusableBlock,
		rss,
		search,
		separator,
		shortcode,
		spacer,
		table,
		tagCloud,
		textColumns,
		verse,
		video,

		// theme blocks
		siteLogo,
		siteTitle,
		siteTagline,
		templatePart,
		avatar,
		postTitle,
		postExcerpt,
		postFeaturedImage,
		postAuthor,
		postAuthorName,
		postComment,
		postCommentsCount,
		postCommentsLink,
		postDate,
		postTerms,
		postTimeToRead,
		postNavigationLink,
		readMore,
		comments,
		commentAuthorName,
		commentContent,
		commentDate,
		commentEditLink,
		commentReplyLink,
		commentsTitle,
		postCommentsForm,
		tableOfContents,
		logInOut,
		termDescription,
		queryTitle,
		postAuthorBiography,
	].filter( Boolean );

export const getAsyncBlocks = () => [
	[ 'button', 'buttons' ],
	[ 'column', 'columns' ],
	[ 'image', 'gallery' ],
	[
		'post-template',
		'query-pagination-previous',
		'query-pagination-numbers',
		'query-pagination-next',
		'query-pagination',
		'query-no-results',
		'query',
	],
	[
		'comments-pagination-previous',
		'comments-pagination-next',
		'comments-pagination-numbers',
		'comments-pagination',
		'comment-template',
	],
	[ 'home-link', 'navigation-link', 'navigation-submenu', 'navigation' ],
	[ 'page-list', 'page-list-item' ],
	[ 'social-link', 'social-links' ],
	[ 'nextpage', 'post-content' ],
];

export const asyncLoadBlock = async ( blockType ) => {
	await import( './' + blockType + '/init.js' );
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
export const __experimentalGetCoreBlocks = () =>
	getAllBlocks().filter(
		( { metadata } ) => ! isBlockMetadataExperimental( metadata )
	);

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
	blocks.forEach( ( { init } ) => init() );

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
			const enabledExperiments = [ enableFSEBlocks ? 'fse' : null ];
			getAllBlocks()
				.filter( ( { metadata } ) =>
					isBlockMetadataExperimental( metadata )
				)
				.filter(
					( { metadata: { __experimental } } ) =>
						__experimental === true ||
						enabledExperiments.includes( __experimental )
				)
				.forEach( ( { init } ) => init() );
	  }
	: undefined;
