/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export const useNavigationTreeNodes = () => {
	const [ nodes, setNodes ] = useState( {} );

	const getNode = ( key ) => nodes[ key ];

	const addNode = ( key, value ) => {
		const valueCopy = { ...value };
		delete valueCopy.children;

		setNodes( ( original ) => ( {
			...original,
			[ key ]: valueCopy,
		} ) );
	};

	const removeNode = ( key ) =>
		setNodes( ( original ) => {
			const originalCopy = { ...original };
			delete originalCopy[ key ];
			return originalCopy;
		} );

	return { nodes, getNode, addNode, removeNode };
};
