/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export const useNavigationTreeNodes = () => {
	const [ nodes, setNodes ] = useState( {} );

	const getNode = ( key ) => nodes[ key ];

	const addNode = ( key, value ) => {
		const { children, ...newNode } = value;
		return setNodes( ( original ) => ( {
			...original,
			[ key ]: newNode,
		} ) );
	};

	const removeNode = ( key ) => {
		return setNodes( ( original ) => {
			const { [ key ]: removedNode, ...remainingNodes } = original;
			return remainingNodes;
		} );
	};

	return { nodes, getNode, addNode, removeNode };
};
