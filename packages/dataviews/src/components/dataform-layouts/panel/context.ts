/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const PanelMenuContext = createContext< { onClose: () => void } >( {
	onClose: () => {},
} );

export function usePanelMenuOnClose() {
	return useContext( PanelMenuContext ).onClose;
}

export default PanelMenuContext;
