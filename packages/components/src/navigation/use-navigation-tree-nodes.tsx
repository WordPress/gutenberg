/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export function useNavigationTreeNodes<
	TNode extends { children?: React.ReactNode; [ key: string ]: unknown }
>() {
	const [ nodes, setNodes ] = useState<
		Record< string, Omit< TNode, 'children' > >
	>( {} );

	const getNode = ( key: string ) => nodes[ key ];

	const addNode = ( key: string, value: TNode ) => {
		const { children, ...newNode } = value;
		return setNodes( ( original ) => ( {
			...original,
			[ key ]: newNode,
		} ) );
	};

	const removeNode = ( key: keyof typeof nodes ) => {
		return setNodes( ( original ) => {
			const { [ key ]: removedNode, ...remainingNodes } = original;
			return remainingNodes;
		} );
	};

	return { nodes, getNode, addNode, removeNode };
}
