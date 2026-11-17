import { useSelect } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import {
	getFilteredOverlayViewports,
	type OverlayViewportMap,
} from '../overlay-viewports';
import OverlayPreviewContext from './overlay-preview-context';

/**
 * Returns the viewports in which the Navigation overlay is shown, after
 * plugins have filtered them.
 *
 * The filter runs inside `useSelect`, so it runs again when any store that a
 * callback reads through `select()` changes, for example a plugin's current
 * language. The map keeps its identity while its values are unchanged.
 *
 * @param attributes              Block attributes.
 * @param attributes.overlayMenu  The `overlayMenu` attribute. Untrusted.
 * @param clientId                Block client ID.
 * @param options                 Options.
 * @param options.isWithinOverlay Whether the block is inside a Navigation
 *                                overlay template part being edited.
 * @return Viewport map, or `null` for the default `mobile` behavior.
 */
export default function useFilteredOverlayViewports(
	attributes: { overlayMenu?: unknown; [ key: string ]: unknown },
	clientId: string,
	{ isWithinOverlay = false }: { isWithinOverlay?: boolean } = {}
): OverlayViewportMap | null {
	const isInOverlayPreview = useContext( OverlayPreviewContext );
	const isInOverlay = isWithinOverlay || isInOverlayPreview;
	return useSelect(
		() =>
			getFilteredOverlayViewports( attributes, clientId, {
				isWithinOverlay: isInOverlay,
			} ),
		[ attributes, clientId, isInOverlay ]
	);
}
