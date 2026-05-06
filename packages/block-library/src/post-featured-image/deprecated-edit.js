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

	// Only migrate when both conditions are true: the target block type is
	// registered, and the block is in an editable context (not locked by a
	// template or synced-pattern). `canRemoveBlock` covers both cases — if
	// false, `replaceBlocks` would silently no-op anyway (e.g. site editor
	// "browse" mode before the user actively edits the template).
	const { targetBlockRegistered, canReplace } = useSelect(
		( select ) => ( {
			targetBlockRegistered: !! select( blocksStore ).getBlockType(
				'core/post-featured-media'
			),
			canReplace: select( blockEditorStore ).canRemoveBlock( clientId ),
		} ),
		[ clientId ]
	);

	useEffect( () => {
		if ( ! targetBlockRegistered || ! canReplace ) {
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
	}, [ targetBlockRegistered, canReplace ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Render the original block as a stable fallback while the replacement is pending.
	return <OriginalEdit { ...props } />;
}
