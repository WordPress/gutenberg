import { createBlock } from '@wordpress/blocks';
import type { BlockTransform, BlockType } from '@wordpress/blocks';
import { isURL, getFilename } from '@wordpress/url';
import type { ShortcodeAttrs, ShortcodeMatch } from '@wordpress/shortcode';
import metadata from './block.json';
import {
	findMoreSuitableBlock,
	rewriteXToTwitter,
	removeAspectRatioClasses,
} from './util';
import type { EmbedAttributes } from './types';

const { name: EMBED_BLOCK } = metadata;

/**
 * Default transforms for generic embeds.
 */
const transforms: BlockType< EmbedAttributes >[ 'transforms' ] = {
	from: [
		{
			type: 'raw',
			isMatch: ( node: Element ) => {
				if ( node.nodeName !== 'P' ) {
					return false;
				}
				// Only a document or doctype has no text content.
				const trimmed = node.textContent!.trim();
				if (
					! isURL( trimmed ) ||
					! /^https:\/\//i.test( trimmed ) ||
					trimmed.match( /https:\/\//gi )?.length !== 1
				) {
					return false;
				}
				// Reject URLs whose filename ends in a file extension,
				// except common page extensions used by permalinks.
				return ! /\.(?!(html?|php)$)[a-z0-9]+$/i.test(
					getFilename( trimmed ) || ''
				);
			},
			transform: ( node: Element ) => {
				// Only a document or doctype has no text content.
				const url = rewriteXToTwitter( node.textContent!.trim() );
				return createBlock( EMBED_BLOCK, {
					url,
					...findMoreSuitableBlock( url )?.attributes,
				} );
			},
		},
		{
			type: 'shortcode',
			tag: 'embed',
			transform: (
				_attrs: ShortcodeAttrs,
				{ shortcode }: ShortcodeMatch
			) => {
				const url = rewriteXToTwitter( shortcode.content?.trim() );
				return createBlock( EMBED_BLOCK, {
					url,
					// Not guaranteed: an `[embed]` shortcode with no content
					// passes `undefined`, which throws, as it did before.
					...findMoreSuitableBlock( url! )?.attributes,
				} );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			isMatch: ( { url }: EmbedAttributes ) => !! url,
			transform: ( { url, caption, className }: EmbedAttributes ) => {
				let value = `<a href="${ url }">${ url }</a>`;
				if ( caption?.trim() ) {
					value += `<br />${ caption }`;
				}
				return createBlock( 'core/paragraph', {
					content: value,
					className: removeAspectRatioClasses( className ),
				} );
			},
		},
		// `BlockBlockTransform` passes `isMatch` an array of attributes, which
		// only multi-block transforms receive.
	] as BlockTransform[],
};

export default transforms;
