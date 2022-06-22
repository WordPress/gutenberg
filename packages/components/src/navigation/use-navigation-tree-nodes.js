/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export const useNavigationTreeNodes = () => {
	const [ nodes, setNodes ] = useState( {} );

	const getNode = ( key ) => nodes[ key ];

	const addNode = ( key, value ) => {
		// eslint-disable-next-line no-unused-vars
		const { children, ...newNode } = value;
		return setNodes( ( original ) => ( {
			...original,
			[ key ]: newNode,
		} ) );
	};

	const removeNode = ( key ) => {
		return setNodes( ( original ) => {
			// eslint-disable-next-line no-unused-vars
			const { [ key ]: removedNode, ...remainingNodes } = original;
			return remainingNodes;
		} );
	};

	return { nodes, getNode, addNode, removeNode };
};
