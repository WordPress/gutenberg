/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import OriginalEdit from './edit';

/**
 * Silently replaces a `core/post-featured-image` block with `core/post-featured-media`
 * the first time it is rendered in the editor. This handles templates that were saved
 * before `core/post-featured-media` existed.
 *
 * The original edit component is rendered as a fallback for the brief period before
 * the replacement fires, so the user sees no flash of broken UI.
 *
 * The PHP render callback for `core/post-featured-image` is left intact, so existing
 * templates continue to display correctly on the frontend until they are re-saved.
 *
 * @param {Object} props Block props forwarded from the block editor.
 */
export default function DeprecatedPostFeaturedImageEdit( props ) {
	const { clientId, attributes } = props;
	const { replaceBlocks } = useDispatch( blockEditorStore );

	// Only migrate if the target block type is registered. Without this guard
	// the effect would silently swallow the block if the block library hasn't
	// been built yet (e.g. during development before `npm run build`).
	const targetBlockRegistered = useSelect(
		( select ) =>
			!! select( blocksStore ).getBlockType( 'core/post-featured-media' ),
		[]
	);

	useEffect( () => {
		if ( ! targetBlockRegistered ) {
			return;
		}
		replaceBlocks(
			clientId,
			createBlock( 'core/post-featured-media', {
				isLink: attributes.isLink,
				linkTarget: attributes.linkTarget,
				aspectRatio: attributes.aspectRatio,
				width: attributes.width,
				height: attributes.height,
				scale: attributes.scale,
				sizeSlug: attributes.sizeSlug,
				controls: true,
			} )
		);
	}, [ targetBlockRegistered ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Render the original block as a stable fallback while the replacement is pending.
	return <OriginalEdit { ...props } />;
}
