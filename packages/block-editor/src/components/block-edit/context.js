/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const Context = createContext();
const { Provider } = Context;

export { Provider as BlockEditContextProvider };

/**
 * A hook that returns the block client ID, name and selected status.
 *
 * @return {Object} Block client ID, name and selected status.
 */
export function useBlockEditContext() {
	const clientId = useContext( Context );
	return useSelect(
		( select ) => {
			const { getBlockName, isBlockSelected } = select(
				blockEditorStore
			);
			return {
				clientId,
				name: getBlockName( clientId ),
				isSelected: isBlockSelected( clientId ),
			};
		},
		[ clientId ]
	);
}
