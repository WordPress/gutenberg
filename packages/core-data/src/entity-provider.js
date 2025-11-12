/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { EntityContext } from './entity-context';

/**
 * Context provider component for providing
 * an entity for a specific entity.
 *
 * @param {Object} props          The component's props.
 * @param {string} props.kind     The entity kind.
 * @param {string} props.type     The entity name.
 * @param {number} props.id       The entity ID.
 * @param {*}      props.children The children to wrap.
 *
 * @return {Object} The provided children, wrapped with
 *                   the entity's context provider.
 */
export default function EntityProvider( { kind, type: name, id, children } ) {
	const parent = useContext( EntityContext );
	const childContext = useMemo(
		() => ( {
			...parent,
			[ kind ]: {
				...parent?.[ kind ],
				[ name ]: id,
			},
		} ),
		[ parent, kind, name, id ]
	);
	return (
		<EntityContext.Provider value={ childContext }>
			{ children }
		</EntityContext.Provider>
	);
}
