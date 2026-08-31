import {
	createContext,
	useContext,
	useMemo,
	useState,
} from '@wordpress/element';

/**
 * Shared state between the Style Book canvas and the Style Book notes sidebar.
 *
 * The two live in different parts of the tree - the canvas inside the editor
 * interface, the sidebar in a complementary-area fill - so they cannot pass
 * props to each other, and a context provider high enough to cover both is the
 * lightest way to connect them without adding editor store surface for what is
 * transient UI state.
 *
 * Control flows one way in each direction. The canvas sets `pendingAnchor`
 * when someone asks to add a note on an example, and the sidebar opens a form
 * for it. The sidebar sets `activeAnchor` when a thread is selected, and the
 * canvas scrolls that example into view and highlights it.
 */
const StyleBookNotesContext = createContext( {
	pendingAnchor: null,
	setPendingAnchor: () => {},
	activeAnchor: null,
	setActiveAnchor: () => {},
} );

export function StyleBookNotesProvider( { children } ) {
	const [ pendingAnchor, setPendingAnchor ] = useState( null );
	const [ activeAnchor, setActiveAnchor ] = useState( null );

	const value = useMemo(
		() => ( {
			pendingAnchor,
			setPendingAnchor,
			activeAnchor,
			setActiveAnchor,
		} ),
		[ pendingAnchor, activeAnchor ]
	);

	return (
		<StyleBookNotesContext.Provider value={ value }>
			{ children }
		</StyleBookNotesContext.Provider>
	);
}

export function useStyleBookNotesContext() {
	return useContext( StyleBookNotesContext );
}
