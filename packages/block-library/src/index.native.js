/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	setDefaultBlockName,
	setUnregisteredTypeHandlerName,
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
import * as column from './column';
import * as cover from './cover';
import * as embed from './embed';
import * as file from './file';
import * as html from './html';
import * as mediaText from './media-text';
import * as latestComments from './latest-comments';
import * as latestPosts from './latest-posts';
import * as list from './list';
import * as missing from './missing';
import * as more from './more';
import * as nextpage from './nextpage';
import * as preformatted from './preformatted';
import * as pullquote from './pullquote';
import * as reusableBlock from './block';
import * as rss from './rss';
import * as search from './search';
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

export const coreBlocks = [
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
	html,
	mediaText,
	latestComments,
	latestPosts,
	missing,
	more,
	nextpage,
	preformatted,
	pullquote,
	rss,
	search,
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
].reduce( ( memo, block ) => {
	memo[ block.name ] = block;
	return memo;
}, {} );

export const registerCoreBlocks = () => {
	[
		paragraph,
		heading,
		code,
		missing,
		more,
		image,
		video,
		nextpage,
		separator,
		list,
		quote,
	].forEach( ( { metadata, name, settings } ) => {
		registerBlockType( name, {
			...metadata,
			...settings,
		} );
	} );
};

setDefaultBlockName( paragraph.name );
setUnregisteredTypeHandlerName( missing.name );
