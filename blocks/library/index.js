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
		// FIXME: Temporary fix.
		//
		// The Shortcode block declares a catch-all shortcode transform,
		// meaning it will attempt to intercept pastes and block conversions of
		// any valid shortcode-like content. Other blocks (e.g. Gallery) may
		// declare specific shortcode transforms (e.g. `[gallery]`), with which
		// this block would conflict. Thus, the Shortcode block needs to be
		// registered as early as possible, so that any other block types'
		// shortcode transforms can be honoured.
		//
		// This isn't a proper solution, as it is at odds with the
		// specification of shortcode conversion, in the sense that conversion
		// is explicitly independent of block order. Thus, concurrent parse
		// rules (i.e. a same text input can yield two different transforms,
		// like `[gallery] -> { Gallery, Shortcode }`) are unsupported,
		// yielding non-deterministic results. A proper solution could be to
		// let the editor (or site owners) determine a default block handler of
		// unknown shortcodes — see `setUnknownTypeHandlerName`.
		shortcode,

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
