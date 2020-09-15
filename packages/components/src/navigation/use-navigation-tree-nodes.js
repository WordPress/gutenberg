/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export const useNavigationTreeNodes = () => {
	const [ nodes, setNodes ] = useState( {} );

	const addNode = ( key, value ) =>
		setNodes( ( original ) => ( {
			...original,
			[ key ]: { ...value, children: undefined },
		} ) );

	const removeNode = ( key ) =>
		setNodes( ( original ) => {
			const originalCopy = { ...original };
			delete originalCopy[ key ];
			return originalCopy;
		} );

	return { nodes, addNode, removeNode };
};
