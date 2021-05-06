/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export const useNavigationTreeNodes = () => {
	const [ nodes, setNodes ] = useState( {} );

	const getNode = ( key ) => nodes[ key ];

	const addNode = ( key, value ) =>
		setNodes( ( original ) => ( {
			...original,
			[ key ]: omit( value, 'children' ),
		} ) );

	const removeNode = ( key ) =>
		setNodes( ( original ) => omit( original, key ) );

	return { nodes, getNode, addNode, removeNode };
};
