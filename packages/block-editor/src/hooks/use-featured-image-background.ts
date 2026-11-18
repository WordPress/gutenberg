import { useContext, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import BlockContext from '../components/block-context';
import { store as blockEditorStore } from '../store';
import { featuredImageSelectKey } from '../store/private-keys';
import type { FeaturedImage } from '../store/types';
import type { PanelStyle } from '../components/global-styles/types';

/**
 * The `source` of a background image that shows the featured image of the
 * post the block renders in. The server looks up the image at render time.
 */
export const FEATURED_IMAGE_SOURCE = 'featured-image';

const UNSUPPORTED: FeaturedImage = { isSupported: false };

/**
 * Checks whether a background image value shows the post's featured image.
 *
 * @param backgroundImage A `style.background.backgroundImage` value.
 * @return Whether the value is the featured image.
 */
export function isFeaturedImageBackground( backgroundImage: unknown ) {
	return (
		!! backgroundImage &&
		typeof backgroundImage === 'object' &&
		( backgroundImage as { source?: unknown } ).source ===
			FEATURED_IMAGE_SOURCE
	);
}

/**
 * Looks up the featured image of the post in the block's context. The editor
 * supplies the lookup, so it is unsupported where there is no post to read,
 * such as in Global Styles.
 *
 * @param enabled Whether to look up the image.
 * @return Whether featured images are supported, and the image when set.
 */
export function useFeaturedImage( enabled = true ): FeaturedImage {
	const context = useContext( BlockContext );
	// Block context values are untyped.
	const postId = context.postId as number | undefined;
	const postType = context.postType as string | undefined;

	return useSelect(
		( select ) => {
			if ( ! enabled ) {
				return UNSUPPORTED;
			}
			const lookup =
				select( blockEditorStore ).getSettings()[
					featuredImageSelectKey
				];
			if ( ! lookup ) {
				return UNSUPPORTED;
			}
			const { isSupported, id, url, title } = lookup( select, {
				postId,
				postType,
			} );
			return { isSupported, id, url, title };
		},
		[ enabled, postId, postType ]
	);
}

/**
 * Replaces a featured image background with the image's URL, so the editor
 * previews the same background the server renders.
 *
 * @param style A block's style attribute.
 * @return The style, with the featured image resolved when there is one.
 */
export function useFeaturedImageBackgroundStyle(
	style: PanelStyle | undefined
): PanelStyle | undefined {
	const isFeaturedImage = isFeaturedImageBackground(
		style?.background?.backgroundImage
	);
	const { url } = useFeaturedImage( isFeaturedImage );

	return useMemo( () => {
		if ( ! isFeaturedImage || ! url ) {
			return style;
		}
		return {
			...style,
			background: {
				...style?.background,
				backgroundImage: { url, source: FEATURED_IMAGE_SOURCE },
			},
		};
	}, [ style, isFeaturedImage, url ] );
}
