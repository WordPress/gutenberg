/**
 * WordPress dependencies
 */
import { removep, autop } from '@wordpress/autop';
import { getBlockTransforms, rawHandler } from '@wordpress/blocks';
import { next } from '@wordpress/shortcode';

const getShortcodeFromTransforms = () =>
	getBlockTransforms( 'from' ).filter(
		( transform ) =>
			transform.type === 'shortcode' &&
			transform.blockName !== 'core/shortcode'
	);

// Single-shortcode only: keeps the transform menu honest (one block in, one
// block out) and avoids unmatched shortcodes silently falling back to freeform.
const isSingleShortcode = ( text, tag ) => {
	const trimmed = text.trim();
	const match = next( tag, trimmed );
	return (
		!! match && match.index === 0 && match.content.length === trimmed.length
	);
};

const transforms = {
	from: [
		{
			type: 'shortcode',
			// Per "Shortcode names should be all lowercase and use all
			// letters, but numbers and underscores should work fine too.
			// Be wary of using hyphens (dashes), you'll be better off not
			// using them." in https://codex.wordpress.org/Shortcode_API
			// Require that the first character be a letter. This notably
			// prevents footnote markings ([1]) from being caught as
			// shortcodes.
			tag: '[a-z][a-z0-9_-]*',
			attributes: {
				text: {
					type: 'string',
					shortcode: ( attrs, { content } ) => {
						return removep( autop( content ) );
					},
				},
			},
			priority: 20,
		},
	],
	// One `to` transform per registered shortcode-from block. A single transform
	// with a dynamic `blocks` list won't work: `isMatch` runs once per
	// transform, so all targets would surface (or none) regardless of which
	// shortcode tag the block actually contains.
	get to() {
		return getShortcodeFromTransforms().map( ( fromTransform ) => ( {
			type: 'block',
			blocks: [ fromTransform.blockName ],
			isMatch: ( { text = '' } ) => {
				return []
					.concat( fromTransform.tag )
					.some( ( tag ) => isSingleShortcode( text, tag ) );
			},
			transform: ( { text = '' } ) => {
				return rawHandler( { HTML: `<p>${ text.trim() }</p>` } );
			},
		} ) );
	},
};

export default transforms;
