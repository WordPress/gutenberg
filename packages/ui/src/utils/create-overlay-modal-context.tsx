import { createContext, useContext } from '@wordpress/element';

type OverlayModalProviderProps< Modal > = {
	modal: Modal;
	children: React.ReactNode;
};

/**
 * Creates a modal context pair (`Provider` + `useModal`) for overlay
 * primitives like Dialog and Drawer.
 */
export function createOverlayModalContext< Modal >( initialValue: Modal ) {
	const OverlayModalContext = createContext< Modal >( initialValue );

	function OverlayModalProvider( {
		modal,
		children,
	}: OverlayModalProviderProps< Modal > ) {
		return (
			<OverlayModalContext.Provider value={ modal }>
				{ children }
			</OverlayModalContext.Provider>
		);
	}

	function useOverlayModal() {
		return useContext( OverlayModalContext );
	}

	return {
		Provider: OverlayModalProvider,
		useModal: useOverlayModal,
	};
}
