/**
 * WordPress dependencies
 */
import { createContext, useContext, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { defaultEntities, kinds } from './entities';

const entities = {
	...defaultEntities.reduce( ( acc, entity ) => {
		if ( ! acc[ entity.kind ] ) {
			acc[ entity.kind ] = {};
		}
		acc[ entity.kind ][ entity.name ] = { context: createContext() };
		return acc;
	}, {} ),
	...kinds.reduce( ( acc, kind ) => {
		acc[ kind.name ] = {};
		return acc;
	}, {} ),
};
const getEntity = ( kind, type ) => {
	if ( ! entities[ kind ] ) {
		throw new Error( `Missing entity config for kind: ${ kind }.` );
	}

	if ( ! entities[ kind ][ type ] ) {
		entities[ kind ][ type ] = { context: createContext() };
	}

	return entities[ kind ][ type ];
};

/**
 * Context provider component for providing
 * an entity for a specific entity type.
 *
 * @param {Object} props          The component's props.
 * @param {string} props.kind     The entity kind.
 * @param {string} props.type     The entity type.
 * @param {number} props.id       The entity ID.
 * @param {*}      props.children The children to wrap.
 *
 * @return {Object} The provided children, wrapped with
 *                   the entity's context provider.
 */
export default function EntityProvider( { kind, type, id, children } ) {
	const Provider = getEntity( kind, type ).context.Provider;
	return <Provider value={ id }>{ children }</Provider>;
}

/**
 * Hook that returns the value and a setter for the
 * specified property of the nearest provided
 * entity of the specified type.
 *
 * @param {string} kind The entity kind.
 * @param {string} type The entity type.
 * @param {string} prop The property name.
 *
 * @return {[*, Function]} A tuple where the first item is the
 *                          property value and the second is the
 *                          setter.
 */
export function useEntityProp( kind, type, prop ) {
	const id = useContext( getEntity( kind, type ).context );

	const value = useSelect(
		( select ) => {
			const entity = select( 'core' ).getEditedEntityRecord( kind, type, id );
			return entity && entity[ prop ];
		},
		[ kind, type, id, prop ]
	);

	const { editEntityRecord } = useDispatch( 'core' );
	const setValue = useCallback(
		( newValue ) => {
			editEntityRecord( kind, type, id, {
				[ prop ]: newValue,
			} );
		},
		[ kind, type, id, prop ]
	);

	return [ value, setValue ];
}
