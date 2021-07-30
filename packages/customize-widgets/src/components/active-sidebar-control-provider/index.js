/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useEffect,
	useState,
} from '@wordpress/element';

const ActiveSidebarControlContext = createContext( [] );

export default function ActiveSidebarControlProvider( {
	children,
	sidebarControls,
} ) {
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

	return (
		<ActiveSidebarControlContext.Provider value={ activeSidebarControl }>
			{ children }
		</ActiveSidebarControlContext.Provider>
	);
}

export const useActiveSidebarControl = () =>
	useContext( ActiveSidebarControlContext );
