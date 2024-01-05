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

	useLayoutEffect( () => {
		function updateIsCollapsed() {
			setIsCollapsed( shouldBeCollapsed() );
		}
		window.addEventListener( 'resize', debounce( updateIsCollapsed, 100 ) );
		return () => {
			window.removeEventListener( 'resize', updateIsCollapsed );
		};
	} );

	return isCollapsed;
}

export default useIsCollapsed;
