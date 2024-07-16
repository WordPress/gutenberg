/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { EntityContext } from '../entity-context';

/**
 * Hook that returns the ID for the nearest
 * provided entity of the specified type.
 *
 * @param {string} kind The entity kind.
 * @param {string} name The entity name.
 */
export default function useEntityId( kind, name ) {
	const context = useContext( EntityContext );
	return context?.[ kind ]?.[ name ];
}
