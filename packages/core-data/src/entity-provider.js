/**
 * WordPress dependencies
 */
import { createContext, useContext, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { defaultEntities } from './entities';

const entities = {
	...defaultEntities.reduce( ( acc, entity ) => {
		acc[ entity.name ] = { kind: entity.kind, context: createContext() };
		return acc;
	}, {} ),
	post: { kind: 'postType', context: createContext() },
};

/**
 * Context provider component for providing
 * an entity for a specific entity type.
 *
 * @param {number} id       The entity ID.
 * @param {string} type     The entity type.
 * @param {*}      children The children to wrap.
 *
 * @return {Object} The provided children, wrapped with
 *                   the entity's context provider.
 */
export default function EntityProvider( { id, type, children } ) {
	const Provider = entities[ type ].context.Provider;
	return <Provider value={ id }>{ children }</Provider>;
}

/**
 * Hook that returns the value and a setter for the
 * specified property of the nearest provided
 * entity of the specified type.
 *
 * @param {string} type The entity type.
 * @param {string} prop The property name.
 *
 * @return {[*, Function]} A tuple where the first item is the
 *                          property value and the second is the
 *                          setter.
 */
export function useEntityProp( type, prop ) {
	const kind = entities[ type ].kind;
	const id = useContext( entities[ type ].context );

	const value = useSelect(
		( select ) => {
			if ( ! id ) {
				return;
			}
			const entity =
				id && select( 'core' ).getEditedEntityRecord( kind, type, id )[ prop ];
			return entity && entity[ prop ];
		},
		[ kind, type, id, prop ]
	);

	const { editEntityRecord } = useDispatch( 'core' );
	const setValue = useCallback(
		( newValue ) =>
			editEntityRecord( kind, type, id, {
				[ prop ]: newValue,
			} ),
		[ kind, type, id, prop ]
	);

	return [ value, setValue ];
}
