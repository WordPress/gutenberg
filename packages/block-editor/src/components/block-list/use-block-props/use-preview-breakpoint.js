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

/**
 * Detects the current viewport breakpoint and returns visibility classes for blocks.
 *
 * The preview dropdown sets canvas widths:
 * - Mobile: 360px canvas
 * - Tablet: 780px canvas
 * - Desktop: full width
 *
 * This hook:
 * 1. Gets block visibility settings from block attributes
 * 2. Detects the current viewport breakpoint
 * 3. Returns the appropriate CSS classes and hidden state
 *
 * @param {string} clientId Block client ID.
 * @return {Object} Visibility classes and state with `breakpointClasses` (Object) and `isHiddenEverywhere` (boolean).
 */
export function usePreviewBreakpoint( clientId ) {
	// Get visibility settings from block attributes
	const { blockVisibility, breakpointVisibility } = useSelect(
		( select ) => {
			const block = select( blockEditorStore ).getBlock( clientId );
			const metadata = block?.attributes?.metadata;
			return {
				blockVisibility: metadata?.blockVisibility,
				breakpointVisibility: metadata?.blockVisibilityBreakpoints,
			};
		},
		[ clientId ]
	);

	// Detect current viewport to match preview dropdown canvas widths
	// All hooks must be called unconditionally
	// These breakpoints match the PHP CSS media queries:
	// Mobile: <= 599px, Tablet: 600px-959px, Desktop: >= 960px
	// @TODO GB uses `useViewportMatch( 'medium', '<' )` for isMobile, but
	// we need to play nice with the preview dropdown, which uses different widths.
	const isSmallOrLarger = useViewportMatch( 'small', '>=' ); // >= 600px
	const isLargeOrLarger = useViewportMatch( 'large', '>=' ); // >= 960px

	// Mobile: viewport < 600px (matches PHP: max-width: 599px)
	const isMobileViewport = ! isSmallOrLarger;
	// Tablet: viewport >= 600px and < 960px (matches PHP: 600px-959px)
	const isTabletViewport = isSmallOrLarger && ! isLargeOrLarger;
	// Desktop: viewport >= 960px (matches PHP: min-width: 960px)
	const isDesktopViewport = isLargeOrLarger;

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
