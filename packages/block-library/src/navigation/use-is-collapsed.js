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

	const shouldBeCollapsed = () => {
		return (
			( 'mobile' === overlayMenu && isMobileBreakPoint ) ||
			'always' === overlayMenu ||
			( 'auto' === overlayMenu && navigationIsWrapping( navRef.current ) )
		);
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
