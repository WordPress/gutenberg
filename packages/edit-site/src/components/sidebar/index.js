/**
 * WordPress dependencies
 */
import { __unstableMotion as motion } from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';
import {
	useCallback,
	createContext,
	useState,
	useRef,
	useEffect,
} from '@wordpress/element';
import { focus } from '@wordpress/dom';

export const SidebarNavigationContext = createContext( () => {} );

function getAnim( direction ) {
	switch ( direction ) {
		case 'back':
			return {
				initial: { opacity: 0, x: '-50px' },
				animate: { opacity: 1, x: '0' },
			};
		case 'forward':
			return {
				initial: { opacity: 0, x: '50px' },
				animate: { opacity: 1, x: '0' },
			};
		default:
			return { initial: false, animate: false };
	}
}

export default function SidebarContent( { routeKey, children } ) {
	const [ { navDirection, focusSelector }, setNavState ] = useState( {
		navDirection: null,
		focusSelector: null,
	} );

	const navigate = useCallback( ( direction, backFocusSelector = null ) => {
		setNavState( ( prevDir ) => ( {
			navDirection: direction,
			focusSelector:
				direction === 'forward'
					? backFocusSelector
					: prevDir.focusSelector,
		} ) );
	}, [] );

	const wrapperRef = useRef();
	useEffect( () => {
		let elementToFocus;
		if ( navDirection === 'back' && focusSelector ) {
			elementToFocus = wrapperRef.current.querySelector( focusSelector );
		}
		if ( ! elementToFocus ) {
			const [ firstTabbable ] = focus.tabbable.find( wrapperRef.current );
			elementToFocus = firstTabbable ?? wrapperRef.current;
		}
		elementToFocus?.focus();
	}, [ navDirection, focusSelector ] );

	const disableMotion = useReducedMotion();
	const { initial, animate } = getAnim( navDirection );

	return (
		<SidebarNavigationContext.Provider value={ navigate }>
			<div className="edit-site-sidebar__content">
				<motion.div
					ref={ wrapperRef }
					key={ routeKey }
					className="edit-site-sidebar__screen-wrapper"
					initial={ ! disableMotion && initial }
					animate={ ! disableMotion && animate }
					transition={ { duration: 0.14 } }
				>
					{ children }
				</motion.div>
			</div>
		</SidebarNavigationContext.Provider>
	);
}
