/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { createContext, useContext } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const BlockClientId = createContext();

/**
 * Internal dependencies
 */
import Edit from './edit';

/**
 * Returns the current (contextual) block client ID.
 *
 * @return {string} The block client ID.
 */
export function useBlockClientId() {
	return useContext( BlockClientId );
}

/**
 * A hook that returns the block client ID, name and selected status.
 *
 * @deprecated
 *
 * @return {Object} Block client ID, name and selected status.
 */
export function useBlockEditContext() {
	deprecated( 'wp.blockEditor.useBlockEditContext', {
		alternative: 'wp.blockEditor.useBlockClientId and wp.data.useSelect',
	} );
	const clientId = useBlockClientId();
	return useSelect(
		( select ) => {
			if ( ! clientId ) {
				return {};
			}

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

export default function BlockEdit( props ) {
	return (
		<BlockClientId.Provider value={ props.clientId }>
			<Edit { ...props } />
		</BlockClientId.Provider>
	);
}
