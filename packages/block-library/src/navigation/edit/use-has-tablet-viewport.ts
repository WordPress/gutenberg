import { useSettings } from '@wordpress/block-editor';
import { getViewportMediaQueries } from '@wordpress/global-styles-engine';

/**
 * Returns whether the theme has a tablet breakpoint.
 *
 * Matches the editor's device preview, which offers Tablet only when the
 * theme's viewport settings give it a valid tablet breakpoint. Defaults apply
 * when the theme sets none.
 *
 * @return Whether the theme has a tablet breakpoint.
 */
export default function useHasTabletViewport(): boolean {
	const [ viewportSettings ] = useSettings( 'viewport' );
	return (
		getViewportMediaQueries(
			viewportSettings as Parameters<
				typeof getViewportMediaQueries
			>[ 0 ]
		)[ '@tablet' ] !== undefined
	);
}
