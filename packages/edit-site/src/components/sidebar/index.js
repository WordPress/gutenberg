/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	createContext,
	useState,
	useRef,
	useEffect,
} from '@wordpress/element';
import { focus } from '@wordpress/dom';

export const SidebarNavigationContext = createContext( () => {} );

export default function SidebarContent( { routeKey, children } ) {
	const [ navState, setNavState ] = useState( {
		direction: null,
		focusSelector: null,
	} );

	const navigate = useCallback( ( direction, focusSelector = null ) => {
		setNavState( ( prevState ) => ( {
			direction,
			focusSelector:
				direction === 'forward' && focusSelector
					? focusSelector
					: prevState.focusSelector,
		} ) );
	}, [] );

	const wrapperRef = useRef();
	useEffect( () => {
		let elementToFocus;
		if ( navState.direction === 'back' && navState.focusSelector ) {
			elementToFocus = wrapperRef.current.querySelector(
				navState.focusSelector
			);
		}
		if ( navState.direction !== null && ! elementToFocus ) {
			const [ firstTabbable ] = focus.tabbable.find( wrapperRef.current );
			elementToFocus = firstTabbable ?? wrapperRef.current;
		}
		elementToFocus?.focus();
	}, [ navState ] );

	const wrapperCls = classnames( 'edit-site-sidebar__screen-wrapper', {
		'slide-from-left': navState.direction === 'back',
		'slide-from-right': navState.direction === 'forward',
	} );

	return (
		<SidebarNavigationContext.Provider value={ navigate }>
			<div className="edit-site-sidebar__content">
				<div
					ref={ wrapperRef }
					key={ routeKey }
					className={ wrapperCls }
				>
					{ children }
				</div>
			</div>
		</SidebarNavigationContext.Provider>
	);
}
