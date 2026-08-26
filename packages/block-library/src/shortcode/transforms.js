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
	// Matching and the shortcode's own text are declared in `block.json`.
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
