/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { isURL, getFilename } from '@wordpress/url';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import {
	findMoreSuitableBlock,
	rewriteXToTwitter,
	removeAspectRatioClasses,
} from './util';

const { name: EMBED_BLOCK } = metadata;

/**
 * Default transforms for generic embeds.
 */
const transforms = {
	from: [
		{
			type: 'raw',
			isMatch: ( node ) => {
				if ( node.nodeName !== 'P' ) {
					return false;
				}
				const trimmed = node.textContent.trim();
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
			transform: ( node ) => {
				const url = rewriteXToTwitter( node.textContent.trim() );
				return createBlock( EMBED_BLOCK, {
					url,
					...findMoreSuitableBlock( url )?.attributes,
				} );
			},
		},
		{
			type: 'shortcode',
			tag: 'embed',
			transform: ( _attrs, { shortcode } ) => {
				const url = rewriteXToTwitter( shortcode.content?.trim() );
				return createBlock( EMBED_BLOCK, {
					url,
					...findMoreSuitableBlock( url )?.attributes,
				} );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			isMatch: ( { url } ) => !! url,
			transform: ( { url, caption, className } ) => {
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
	],
};

export default transforms;
