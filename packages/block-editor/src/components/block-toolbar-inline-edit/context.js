/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useMemo,
	useState,
} from '@wordpress/element';

export const BlockToolbarInlineEditContext = createContext( false );

export function BlockToolbarInlineEditProvider( { children } ) {
	const [ isEditingInline, setIsEditingInline ] = useState( false );
	const providerValue = useMemo(
		() => ( {
			isEditingInline,
			setIsEditingInline,
		} ),
		[ isEditingInline, setIsEditingInline ]
	);

	return (
		<BlockToolbarInlineEditContext.Provider value={ providerValue }>
			{ children }
		</BlockToolbarInlineEditContext.Provider>
	);
}

export const useBlockToolbarInlineEditContext = () =>
	useContext( BlockToolbarInlineEditContext );
