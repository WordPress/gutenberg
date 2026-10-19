import { useContext, useMemo } from '@wordpress/element';
import { EntityContext } from './entity-context';
import type { EntityProviderProps, PrivateEntityProviderProps } from './types';

/**
 * Context provider component for providing
 * an entity for a specific entity.
 *
 * @param props            The component's props.
 * @param props.kind       The entity kind.
 * @param props.type       The entity name.
 * @param props.id         The entity ID.
 * @param props.revisionId Optional revision ID. When set,
 *                         `useEntityProp` reads from the
 *                         revision record instead of the
 *                         current entity. Applies only to this
 *                         entity, not to others rendered within
 *                         it.
 * @param props.children   The children to wrap.
 *
 * @return The provided children, wrapped with
 *         the entity's context provider.
 */
export default function EntityProvider( {
	kind,
	type,
	id,
	revisionId,
	children,
}: EntityProviderProps ) {
	return (
		<PrivateEntityProvider
			kind={ kind }
			type={ type }
			id={ id }
			revisionId={ revisionId }
		>
			{ children }
		</PrivateEntityProvider>
	);
}

/**
 * Like `EntityProvider`, but also accepts a record to read from instead of
 * the current entity, for content that isn't stored as a revision. Fields the
 * record doesn't have are read from the current entity.
 *
 * @param props            The component's props.
 * @param props.kind       The entity kind.
 * @param props.type       The entity name.
 * @param props.id         The entity ID.
 * @param props.revisionId Optional revision ID.
 * @param props.revision   Optional record to read from.
 * @param props.children   The children to wrap.
 *
 * @return The provided children, wrapped with
 *         the entity's context provider.
 */
export function PrivateEntityProvider( {
	kind,
	type: name,
	id,
	revisionId,
	revision,
	children,
}: PrivateEntityProviderProps ) {
	const parent = useContext( EntityContext );
	const providedRevision = revision ?? revisionId;
	const childContext = useMemo(
		() => ( {
			...parent,
			...( kind && {
				[ kind ]: {
					...parent?.[ kind ],
					[ name ]: id,
				},
			} ),
			...( providedRevision !== undefined &&
				kind && {
					revision: {
						...parent?.revision,
						[ kind ]: {
							...parent?.revision?.[ kind ],
							[ name ]: providedRevision,
						},
					},
				} ),
		} ),
		[ parent, kind, name, id, providedRevision ]
	);
	return (
		<EntityContext.Provider value={ childContext }>
			{ children }
		</EntityContext.Provider>
	);
}
