/**
 * WordPress dependencies
 */
import {
	createContext,
	useMemo,
	useContext,
	useEffect,
	useState,
} from '@wordpress/element';

export const SidebarControlsContext = createContext();

export default function SidebarControls( { sidebarControls, children } ) {
	const [ activeSidebarControl, setActiveSidebarControl ] = useState( null );

	useEffect( () => {
		const unsubscribers = sidebarControls.map( ( sidebarControl ) =>
			sidebarControl.subscribe( ( expanded ) => {
				if ( expanded ) {
					setActiveSidebarControl( sidebarControl );
				}
			} )
		);

		return () => {
			unsubscribers.forEach( ( unsubscriber ) => unsubscriber() );
		};
	}, [ sidebarControls ] );

	const context = useMemo(
		() => ( {
			sidebarControls,
			activeSidebarControl,
		} ),
		[ sidebarControls, activeSidebarControl ]
	);

	return (
		<SidebarControlsContext.Provider value={ context }>
			{ children }
		</SidebarControlsContext.Provider>
	);
}

export function useSidebarControls() {
	const { sidebarControls } = useContext( SidebarControlsContext );

	return sidebarControls;
}

export function useActiveSidebarControl() {
	const { activeSidebarControl } = useContext( SidebarControlsContext );

	return activeSidebarControl;
}
