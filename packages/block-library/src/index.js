/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/block-editor';
import '@wordpress/editor';
import {
	registerBlockType,
	setDefaultBlockName,
	setFreeformContentHandlerName,
	setUnregisteredTypeHandlerName,
	unstable__bootstrapServerSideBlockDefinitions, // eslint-disable-line camelcase
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
import * as button from './button';
import * as calendar from './calendar';
import * as categories from './categories';
import * as code from './code';
import * as columns from './columns';
import * as column from './columns/column';
import * as cover from './cover';
import * as embed from './embed';
import * as file from './file';
import * as html from './html';
import * as mediaText from './media-text';
import * as latestComments from './latest-comments';
import * as latestPosts from './latest-posts';
import * as legacyWidget from './legacy-widget';
import * as list from './list';
import * as missing from './missing';
import * as more from './more';
import * as nextpage from './nextpage';
import * as preformatted from './preformatted';
import * as pullquote from './pullquote';
import * as reusableBlock from './block';
import * as rss from './rss';
import * as search from './search';
import * as section from './section';
import * as separator from './separator';
import * as shortcode from './shortcode';
import * as spacer from './spacer';
import * as subhead from './subhead';
import * as table from './table';
import * as template from './template';
import * as textColumns from './text-columns';
import * as verse from './verse';
import * as video from './video';
import * as tagCloud from './tag-cloud';

import * as classic from './classic';

/**
 * Function to register core blocks provided by the block editor.
 *
 * @example
 * ```js
 * import { registerCoreBlocks } from '@wordpress/block-library';
 *
 * registerCoreBlocks();
 * ```
 */
export const registerCoreBlocks = () => {
	[
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
		calendar,
		categories,
		code,
		columns,
		column,
		cover,
		embed,
		...embed.common,
		...embed.others,
		file,
		window.wp && window.wp.oldEditor ? classic : null, // Only add the classic block in WP Context
		html,
		mediaText,
		latestComments,
		latestPosts,
		process.env.GUTENBERG_PHASE === 2 ? legacyWidget : null,
		missing,
		more,
		nextpage,
		preformatted,
		pullquote,
		rss,
		search,
		section,
		separator,
		reusableBlock,
		spacer,
		subhead,
		table,
		tagCloud,
		template,
		textColumns,
		verse,
		video,
	].forEach( ( block ) => {
		if ( ! block ) {
			return;
		}
		const { metadata, settings, name } = block;
		if ( metadata ) {
			unstable__bootstrapServerSideBlockDefinitions( { [ name ]: metadata } ); // eslint-disable-line camelcase
		}
		registerBlockType( name, settings );
	} );

	setDefaultBlockName( paragraph.name );
	if ( window.wp && window.wp.oldEditor ) {
		setFreeformContentHandlerName( classic.name );
	}
	setUnregisteredTypeHandlerName( missing.name );
};
