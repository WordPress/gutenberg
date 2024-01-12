/**
 * WordPress dependencies
 */
import { debounce, useMediaQuery } from '@wordpress/compose';
import { useState, useLayoutEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { NAVIGATION_MOBILE_COLLAPSE } from './constants';
import navigationIsWrapping from './is-wrapping';

function useIsCollapsed( overlayMenu, navRef ) {
	const isMobileBreakPoint = useMediaQuery(
		`(max-width: ${ NAVIGATION_MOBILE_COLLAPSE })`
	);

	// Determines the conditions under which the navigation should be collapsed.
	const shouldBeCollapsed = () => {
		// If the overlay menu is set to always, then it should always be collapsed.
		if ( 'always' === overlayMenu ) {
			return true;
		}

		// If the overlay menu is set to mobile and the screen is at the mobile breakpoint, then it should be collapsed.
		if ( 'mobile' === overlayMenu && isMobileBreakPoint ) {
			return true;
		}

		// If the overlay menu is set to auto, then we need to check if the navigation is wrapping.
		if ( 'auto' === overlayMenu ) {
			if ( ! navRef.current ) {
				return false;
			}

			// If the navigation is already collapsed, then it should stay collapsed.
			// We uncollapse it when the screen is resized so that we can measure the full width of the nav.
			// It's not ideal to use the actual class name here.
			if ( navRef.current.classList.contains( 'is-collapsed' ) ) {
				return true;
			}

			return navigationIsWrapping( navRef.current );
		}
	};

	const [ isCollapsed, setIsCollapsed ] = useState( shouldBeCollapsed() );

	// We need a layout effect to respond to changed in isMobileBreakPoint.
	useLayoutEffect( () => {
		function updateIsCollapsed() {
			setIsCollapsed( shouldBeCollapsed() );
		}

		function setIsCollapsedFalse() {
			setIsCollapsed( false );
		}

		// This is wrapped in a function so that we can unbind it later.
		function debouncedSetIsCollapsedFalse() {
			return debounce( setIsCollapsedFalse, 50 ); // Has to be less than debouncedUpdateIsCollapsed.
		}

		// This is wrapped in a function so that we can unbind it later.
		function debouncedUpdateIsCollapsed() {
			return debounce( updateIsCollapsed, 100 );
		}

		// Set the value of isCollapsed when the effect runs.
		updateIsCollapsed();

		// We only need to add listeners if the overlayMenu is set to auto.
		if ( 'auto' === overlayMenu ) {
			// Adds a listener to set isCollapsed be false so we can measure the full width of the nav.
			window.addEventListener( 'resize', debouncedSetIsCollapsedFalse() );

			// Then add a debounced listener to update isCollapsed.
			window.addEventListener( 'resize', debouncedUpdateIsCollapsed() );

			// Remove the listener when the component is unmounted.
			return () => {
				window.removeEventListener(
					'resize',
					debouncedUpdateIsCollapsed()
				);
				window.removeEventListener(
					'resize',
					debouncedSetIsCollapsedFalse()
				);
			};
		}
	} );

	return isCollapsed;
}

export default useIsCollapsed;
