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
import * as paragraph from '../packages/block-library/src/paragraph';
import * as image from '../packages/block-library/src/image';
import * as heading from '../packages/block-library/src/heading';
import * as quote from '../packages/block-library/src/quote';
import * as gallery from '../packages/block-library/src/gallery';
import * as archives from '../packages/block-library/src/archives';
import * as audio from '../packages/block-library/src/audio';
import * as button from '../packages/block-library/src/button';
import * as categories from '../packages/block-library/src/categories';
import * as code from '../packages/block-library/src/code';
import * as columns from '../packages/block-library/src/columns';
import * as column from '../packages/block-library/src/columns/column';
import * as coverImage from '../packages/block-library/src/cover-image';
import * as embed from '../packages/block-library/src/embed';
import * as file from '../packages/block-library/src/file';
import * as latestComments from '../packages/block-library/src/latest-comments';
import * as latestPosts from '../packages/block-library/src/latest-posts';
import * as list from '../packages/block-library/src/list';
import * as more from '../packages/block-library/src/more';
import * as nextpage from '../packages/block-library/src/nextpage';
import * as preformatted from '../packages/block-library/src/preformatted';
import * as pullquote from '../packages/block-library/src/pullquote';
import * as reusableBlock from '../packages/block-library/src/block';
import * as separator from '../packages/block-library/src/separator';
import * as shortcode from '../packages/block-library/src/shortcode';
import * as spacer from '../packages/block-library/src/spacer';
import * as subhead from '../packages/block-library/src/subhead';
import * as table from '../packages/block-library/src/table';
import * as textColumns from '../packages/block-library/src/text-columns';
import * as verse from '../packages/block-library/src/verse';
import * as video from '../packages/block-library/src/video';

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
