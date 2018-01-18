/**
 * Internal dependencies
 */
import * as audio from './audio';
import * as embed from './embed';
import { registerBlockType } from '../api';
import { registerShortcodeBlock } from './shortcode';
import { registerImageBlock } from './image';
import { registerGalleryBlock } from './gallery';
import { registerHeadingBlock } from './heading';
import { registerQuoteBlock } from './quote';
import { registerListBlock } from './list';
import { registerSeparatorBlock } from './separator';
import { registerMoreBlock } from './more';
import { registerButtonBlock } from './button';
import { registerPullquoteBlock } from './pullquote';
import { registerTableBlock } from './table';
import { registerPreformattedBlock } from './preformatted';
import { registerCodeBlock } from './code';
import { registerHtmlBlock } from './html';
import { registerFreeformBlock } from './freeform';
import { registerLatestPostsBlock } from './latest-posts';
import { registerCategoriesBlock } from './categories';
import { registerCoverImageBlock } from './cover-image';
import { registerTextColumnsBlock } from './text-columns';
import { registerVerseBlock } from './verse';
import { registerVideoBlock } from './video';
import { registerReusableBlock } from './block';
import { registerParagraphBlock } from './paragraph';
import './subhead';

export const registerCoreBlocks = () => {
	[
		audio,
		embed,
		...embed.common,
		...embed.others,
	].forEach( ( { name, settings } ) => {
		registerBlockType( name, settings );
	} );
	registerShortcodeBlock();
	registerImageBlock();
	registerGalleryBlock();
	registerHeadingBlock();
	registerQuoteBlock();
	registerListBlock();
	registerSeparatorBlock();
	registerMoreBlock();
	registerButtonBlock();
	registerPullquoteBlock();
	registerTableBlock();
	registerPreformattedBlock();
	registerCodeBlock();
	registerHtmlBlock();
	registerFreeformBlock();
	registerLatestPostsBlock();
	registerCategoriesBlock();
	registerCoverImageBlock();
	registerTextColumnsBlock();
	registerVerseBlock();
	registerVideoBlock();
	registerReusableBlock();
	registerParagraphBlock();
};
