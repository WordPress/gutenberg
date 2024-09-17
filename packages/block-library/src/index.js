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
import * as button from './button';
import * as buttons from './buttons';
import * as calendar from './calendar';
import * as categories from './categories';
import * as classic from './freeform';
import * as code from './code';
import * as column from './column';
import * as columns from './columns';
import * as comments from './comments';
import * as commentAuthorAvatar from './comment-author-avatar';
import * as commentAuthorName from './comment-author-name';
import * as commentContent from './comment-content';
import * as commentDate from './comment-date';
import * as commentEditLink from './comment-edit-link';
import * as commentReplyLink from './comment-reply-link';
import * as commentTemplate from './comment-template';
import * as commentsPaginationPrevious from './comments-pagination-previous';
import * as commentsPagination from './comments-pagination';
import * as commentsPaginationNext from './comments-pagination-next';
import * as commentsPaginationNumbers from './comments-pagination-numbers';
import * as commentsTitle from './comments-title';
import * as cover from './cover';
import * as details from './details';
import * as embed from './embed';
import * as file from './file';
import * as form from './form';
import * as formInput from './form-input';
import * as formSubmitButton from './form-submit-button';
import * as formSubmissionNotification from './form-submission-notification';
import * as gallery from './gallery';
import * as group from './group';
import * as heading from './heading';
import * as homeLink from './home-link';
import * as html from './html';
import * as image from './image';
import * as latestComments from './latest-comments';
import * as latestPosts from './latest-posts';
import * as list from './list';
import * as listItem from './list-item';
import * as logInOut from './loginout';
import * as mediaText from './media-text';
import * as missing from './missing';
import * as more from './more';
import * as navigation from './navigation';
import * as navigationLink from './navigation-link';
import * as navigationSubmenu from './navigation-submenu';
import * as nextpage from './nextpage';
import * as pattern from './pattern';
import * as pageList from './page-list';
import * as pageListItem from './page-list-item';
import * as paragraph from './paragraph';
import * as postAuthor from './post-author';
import * as postAuthorName from './post-author-name';
import * as postAuthorBiography from './post-author-biography';
import * as postComment from './post-comment';
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
import * as postTimeToRead from './post-time-to-read';
import * as postTitle from './post-title';
import * as preformatted from './preformatted';
import * as pullquote from './pullquote';
import * as query from './query';
import * as queryNoResults from './query-no-results';
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
import * as tableOfContents from './table-of-contents';
import * as tagCloud from './tag-cloud';
import * as templatePart from './template-part';
import * as termDescription from './term-description';
import * as textColumns from './text-columns';
import * as verse from './verse';
import * as video from './video';
import * as footnotes from './footnotes';

import isBlockMetadataExperimental from './utils/is-block-metadata-experimental';

/**
 * Function to get all the block-library blocks in an array
 */
const getAllBlocks = () => {
	const blocks = [
		// Common blocks are grouped at the top to prioritize their display
		// in various contexts — like the inserter and auto-complete components.
		paragraph,
		image,
		heading,
		gallery,
		list,
		listItem,
		quote,

		// Register all remaining core blocks.
		archives,
		audio,
		button,
		buttons,
		calendar,
		categories,
		code,
		column,
		columns,
		commentAuthorAvatar,
		cover,
		details,
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
		pageListItem,
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
		tagCloud,
		textColumns,
		verse,
		video,
		footnotes,

		// theme blocks
		navigation,
		navigationLink,
		navigationSubmenu,
		siteLogo,
		siteTitle,
		siteTagline,
		query,
		templatePart,
		avatar,
		postTitle,
		postExcerpt,
		postFeaturedImage,
		postContent,
		postAuthor,
		postAuthorName,
		postComment,
		postCommentsCount,
		postCommentsLink,
		postDate,
		postTerms,
		postNavigationLink,
		postTemplate,
		postTimeToRead,
		queryPagination,
		queryPaginationNext,
		queryPaginationNumbers,
		queryPaginationPrevious,
		queryNoResults,
		readMore,
		comments,
		commentAuthorName,
		commentContent,
		commentDate,
		commentEditLink,
		commentReplyLink,
		commentTemplate,
		commentsTitle,
		commentsPagination,
		commentsPaginationNext,
		commentsPaginationNumbers,
		commentsPaginationPrevious,
		postCommentsForm,
		tableOfContents,
		homeLink,
		logInOut,
		termDescription,
		queryTitle,
		postAuthorBiography,
	];
	if ( window?.__experimentalEnableFormBlocks ) {
		blocks.push( form );
		blocks.push( formInput );
		blocks.push( formSubmitButton );
		blocks.push( formSubmissionNotification );
	}

	// When in a WordPress context, conditionally
	// add the classic block and TinyMCE editor
	// under any of the following conditions:
	//   - the current post contains a classic block
	//   - the experiment to disable TinyMCE isn't active.
	//   - a query argument specifies that TinyMCE should be loaded
	if (
		window?.wp?.oldEditor &&
		( window?.wp?.needsClassicBlock ||
			! window?.__experimentalDisableTinymce ||
			!! new URLSearchParams( window?.location?.search ).get(
				'requiresTinymce'
			) )
	) {
		blocks.push( classic );
	}

	return blocks.filter( Boolean );
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
	if (
		window.wp &&
		window.wp.oldEditor &&
		blocks.some( ( { name } ) => name === classic.name )
	) {
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
	globalThis.IS_GUTENBERG_PLUGIN
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

export { privateApis } from './private-apis';
