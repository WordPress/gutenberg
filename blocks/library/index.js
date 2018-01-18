/**
 * Internal dependencies
 */
import { registerBlockType } from '../api';
import { registerShortcodeBlock } from './shortcode';
import { registerImageBlock } from './image';
import { registerGalleryBlock } from './gallery';
import { registerHeadingBlock } from './heading';
import { registerQuoteBlock } from './quote';
import {
	registerEmbedBlock,
	registerCommonEmbedBlocks,
	registerOtherEmbedBlocks,
} from './embed';
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
import * as audio from './audio';
import { registerReusableBlock } from './block';
import { registerParagraphBlock } from './paragraph';
import './subhead';

export const registerCoreBlocks = () => {
	registerShortcodeBlock();
	registerImageBlock();
	registerGalleryBlock();
	registerHeadingBlock();
	registerQuoteBlock();
	registerEmbedBlock();
	registerCommonEmbedBlocks();
	registerOtherEmbedBlocks();
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
	registerBlockType( audio.name, audio.settings );
	registerReusableBlock();
	registerParagraphBlock();
};
