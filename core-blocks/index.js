/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	setDefaultBlockName,
	setUnknownTypeHandlerName,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';
import './theme.scss';
import * as paragraph from '../packages/core-blocks/src/paragraph';
import * as image from '../packages/core-blocks/src/image';
import * as heading from '../packages/core-blocks/src/heading';
import * as quote from '../packages/core-blocks/src/quote';
import * as gallery from '../packages/core-blocks/src/gallery';
import * as archives from '../packages/core-blocks/src/archives';
import * as audio from '../packages/core-blocks/src/audio';
import * as button from '../packages/core-blocks/src/button';
import * as categories from '../packages/core-blocks/src/categories';
import * as code from '../packages/core-blocks/src/code';
import * as columns from '../packages/core-blocks/src/columns';
import * as column from '../packages/core-blocks/src/columns/column';
import * as coverImage from '../packages/core-blocks/src/cover-image';
import * as embed from '../packages/core-blocks/src/embed';
import * as file from '../packages/core-blocks/src/file';
import * as latestComments from '../packages/core-blocks/src/latest-comments';
import * as latestPosts from '../packages/core-blocks/src/latest-posts';
import * as list from '../packages/core-blocks/src/list';
import * as more from '../packages/core-blocks/src/more';
import * as nextpage from '../packages/core-blocks/src/nextpage';
import * as preformatted from '../packages/core-blocks/src/preformatted';
import * as pullquote from '../packages/core-blocks/src/pullquote';
import * as reusableBlock from '../packages/core-blocks/src/block';
import * as separator from '../packages/core-blocks/src/separator';
import * as shortcode from '../packages/core-blocks/src/shortcode';
import * as spacer from '../packages/core-blocks/src/spacer';
import * as subhead from '../packages/core-blocks/src/subhead';
import * as table from '../packages/core-blocks/src/table';
import * as textColumns from '../packages/core-blocks/src/text-columns';
import * as verse from '../packages/core-blocks/src/verse';
import * as video from '../packages/core-blocks/src/video';

// The freeform block can't be moved to the "npm" packages folder because it requires the wp.oldEditor global.
import * as freeform from './freeform';

// The HTML block can't be moved to the "npm" packages folder because it requires the CodeEditor component.
import * as html from './html';

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
		categories,
		code,
		columns,
		column,
		coverImage,
		embed,
		...embed.common,
		...embed.others,
		file,
		freeform,
		html,
		latestComments,
		latestPosts,
		more,
		nextpage,
		preformatted,
		pullquote,
		separator,
		reusableBlock,
		spacer,
		subhead,
		table,
		textColumns,
		verse,
		video,
	].forEach( ( { name, settings } ) => {
		registerBlockType( name, settings );
	} );

	setDefaultBlockName( paragraph.name );
	setUnknownTypeHandlerName( freeform.name );
};
