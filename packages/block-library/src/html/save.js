/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';

// The block's markup is normally serialized from its `innerContent` (static
// HTML fragments interleaved with inner blocks), so this `save` output is
// unused for parsed blocks. It only matters as a fallback for the deprecated
// `content` attribute: a block created via `createBlock( 'core/html', {
// content } )` and serialized without ever entering the editor (where it would
// otherwise be migrated to inner content) has no `innerContent`, so the
// serializer falls through to this `save` to avoid losing the content.
export default function save( { attributes } ) {
	return <RawHTML>{ attributes.content }</RawHTML>;
}
