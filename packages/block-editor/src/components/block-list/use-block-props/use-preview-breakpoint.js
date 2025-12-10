/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { deviceTypeKey } from '../../../store/private-keys';

/**
 * Detects the current viewport breakpoint and returns visibility classes for blocks.
 *
 * When deviceType is 'Desktop', uses actual viewport detection via useViewportMatch.
 * When deviceType is 'Mobile' or 'Tablet', overrides viewport detection with the device type.
 *
 * This hook:
 * 1. Gets block visibility settings from block attributes
 * 2. Gets device type from block editor settings
 * 3. Detects viewport (either from deviceType override or actual viewport)
 * 4. Returns the appropriate CSS classes and hidden state
 *
 * @param {string} clientId Block client ID.
 * @return {Object} Visibility classes and state with `breakpointClasses` (Object) and `isHiddenEverywhere` (boolean).
 */
export function usePreviewBreakpoint( clientId ) {
	// Get visibility settings from block attributes and device type from settings
	const { blockVisibility, breakpointVisibility, deviceType } = useSelect(
		( select ) => {
			const block = select( blockEditorStore ).getBlock( clientId );
			const metadata = block?.attributes?.metadata;
			const settings = select( blockEditorStore ).getSettings();
			return {
				blockVisibility: metadata?.blockVisibility,
				breakpointVisibility: metadata?.blockVisibilityBreakpoints,
				deviceType: settings?.[ deviceTypeKey ] || 'Desktop',
			};
		},
		[ clientId ]
	);

	// When Desktop is selected, use actual viewport detection
	// When Mobile/Tablet is selected, override with device type
	// All hooks must be called unconditionally
	const isSmallOrLarger = useViewportMatch( 'small', '>=' ); // >= 600px
	const isLargeOrLarger = useViewportMatch( 'large', '>=' ); // >= 960px

	// Determine viewport flags based on deviceType
	let isMobileViewport, isTabletViewport, isDesktopViewport;

	if ( deviceType === 'Mobile' ) {
		// Override: force mobile viewport
		isMobileViewport = true;
		isTabletViewport = false;
		isDesktopViewport = false;
	} else if ( deviceType === 'Tablet' ) {
		// Override: force tablet viewport
		isMobileViewport = false;
		isTabletViewport = true;
		isDesktopViewport = false;
	} else {
		// Desktop: use actual viewport detection
		// Mobile: viewport < 600px (matches PHP: max-width: 599px)
		isMobileViewport = ! isSmallOrLarger;
		// Tablet: viewport >= 600px and < 960px (matches PHP: 600px-959px)
		isTabletViewport = isSmallOrLarger && ! isLargeOrLarger;
		// Desktop: viewport >= 960px (matches PHP: min-width: 960px)
		isDesktopViewport = isLargeOrLarger;
	}

	// Only apply is-block-hidden class if hidden everywhere (not for breakpoint visibility)
	// Breakpoint visibility is handled by specific classes below
	const isHiddenEverywhere = blockVisibility === false;

	// Memoize breakpoint classes to avoid recreating object on every render
	const breakpointClasses = useMemo( () => {
		if ( ! breakpointVisibility ) {
			return {};
		}
		return {
			'wp-block-hidden-mobile':
				breakpointVisibility.mobile && isMobileViewport,
			'wp-block-hidden-tablet':
				breakpointVisibility.tablet && isTabletViewport,
			'wp-block-hidden-desktop':
				breakpointVisibility.desktop && isDesktopViewport,
		};
	}, [
		breakpointVisibility,
		isMobileViewport,
		isTabletViewport,
		isDesktopViewport,
	] );

	// Memoize return object to maintain referential equality
	return useMemo(
		() => ( {
			breakpointClasses,
			isHiddenEverywhere,
		} ),
		[ breakpointClasses, isHiddenEverywhere ]
	);
}
