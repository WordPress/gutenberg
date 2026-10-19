import { useContext } from '@wordpress/element';
import { EntityContext } from '../entity-context';

/**
 * Hook that returns the ID for the nearest
 * provided entity of the specified type.
 *
 * @param {string} kind The entity kind.
 * @param {string} name The entity name.
 */
export default function useEntityId(
	kind: string,
	name: string
): string | number | undefined {
	const context = useContext( EntityContext );
	// Entity providers set the ID of each kind and name.
	return context?.[ kind ]?.[ name ] as string | number | undefined;
}
