/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';
import { BLOCK_VISIBILITY_VIEWPORTS } from './constants';

/**
 * Returns the resolved viewport definitions for block visibility, merging
 * any theme-defined size overrides into the defaults.
 *
 * Themes can override the `size` of the `mobile` and/or `tablet` viewports
 * via `settings.responsive.viewports` in theme.json. The `desktop` viewport
 * has no size value and cannot be overridden.
 *
 * @return {Object} Viewport definitions keyed by slug.
 */
export function useBlockVisibilityViewports() {
	const [ themeViewports ] = useSettings( 'responsive.viewports' );

	if ( ! themeViewports?.length ) {
		return BLOCK_VISIBILITY_VIEWPORTS;
	}

	const OVERRIDABLE_SLUGS = [ 'mobile', 'tablet' ];
	const merged = { ...BLOCK_VISIBILITY_VIEWPORTS };
	themeViewports.forEach( ( { slug, size } ) => {
		if ( OVERRIDABLE_SLUGS.includes( slug ) ) {
			merged[ slug ] = { ...merged[ slug ], size };
		}
	} );
	return merged;
}
