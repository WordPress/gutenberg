/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useState,
	useRef,
	useLayoutEffect,
} from '@wordpress/element';
import { focus } from '@wordpress/dom';

export const SidebarNavigationContext = createContext( () => {} );
// Focus a sidebar element after a navigation. The element to focus is either
// specified by `focusSelector` (when navigating back) or it is the first
// tabbable element (usually the "Back" button).
function focusSidebarElement( el, direction, focusSelector ) {
	let elementToFocus;
	if ( direction === 'back' && focusSelector ) {
		elementToFocus = el.querySelector( focusSelector );
	}
	if ( direction !== null && ! elementToFocus ) {
		const [ firstTabbable ] = focus.tabbable.find( el );
		elementToFocus = firstTabbable ?? el;
	}
	elementToFocus?.focus();
}

function SidebarContentWrapper( { children } ) {
	const navState = useContext( SidebarNavigationContext );
	const wrapperRef = useRef();
	const [ navAnimation, setNavAnimation ] = useState( null );

	useLayoutEffect( () => {
		const { direction, focusSelector } = navState.get();
		focusSidebarElement( wrapperRef.current, direction, focusSelector );
		setNavAnimation( direction );
	}, [ navState ] );

	const wrapperCls = clsx( 'edit-site-sidebar__screen-wrapper', {
		'slide-from-left': navAnimation === 'back',
		'slide-from-right': navAnimation === 'forward',
	} );

	return (
		<div ref={ wrapperRef } className={ wrapperCls }>
			{ children }
		</div>
	);
}

export default function SidebarContent( { routeKey, children } ) {
	return (
		<div className="edit-site-sidebar__content">
			<SidebarContentWrapper key={ routeKey }>
				{ children }
			</SidebarContentWrapper>
		</div>
	);
}
