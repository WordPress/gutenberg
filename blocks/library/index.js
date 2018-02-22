/**
 * Internal dependencies
 */
import {
	registerBlockType,
	setDefaultBlockName,
	setUnknownTypeHandlerName,
} from '../api';
import * as audio from './audio';
import * as button from './button';
import * as categories from './categories';
import * as code from './code';
import * as columns from './columns';
import * as coverImage from './cover-image';
import * as embed from './embed';
import * as freeform from './freeform';
import * as gallery from './gallery';
import * as heading from './heading';
import * as html from './html';
import * as image from './image';
import * as latestPosts from './latest-posts';
import * as list from './list';
import * as more from './more';
import * as paragraph from './paragraph';
import * as preformatted from './preformatted';
import * as pullquote from './pullquote';
import * as quote from './quote';
import * as reusableBlock from './block';
import * as separator from './separator';
import * as shortcode from './shortcode';
import * as subhead from './subhead';
import * as table from './table';
import * as textColumns from './text-columns';
import * as verse from './verse';
import * as video from './video';

export const registerCoreBlocks = () => {
	[
		audio,
		button,
		categories,
		code,
		columns,
		coverImage,
		embed,
		...embed.common,
		...embed.others,
		freeform,
		gallery,
		heading,
		html,
		image,
		list,
		latestPosts,
		more,
		paragraph,
		preformatted,
		pullquote,
		quote,
		reusableBlock,
		separator,
		shortcode,
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
