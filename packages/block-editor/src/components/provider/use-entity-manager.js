/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * A function to call to inform the entity manager that it is now in charge.
 *
 * @callback setAsPrimary
 * @param {boolean} isPrimary If true, set the entity manager is the primary.
 */

/**
 * A manager is something which needs to keep track of changes in the block editor
 * which might need to be synced back to an entity, or vice-versa.
 *
 * @typedef WPEntityManager
 * @property {string}       id           The id of the manager. Typically the block client
 *                                       ID of an inner block controller.
 * @property {setAsPrimary} setAsPrimary A function to call to set the manager
 *                                       as the primary manager for the entity.
 */

/**
 * This object maintains a list of the entity managers we have. Each entity ID
 * is a key of the object which maps to an array of managers. The first entry in
 * each array is considered the primary manager for the given entity. The primary
 * manager is the only manager which is allowed to sync changes in and out of the
 * block editor from the entity. This way, we do not have multiple managers trying
 * to put identical blocks into the editor in different locations.
 *
 * @type {Object.<string, WPEntityManager[]>}
 */
const _ENTITY_MANAGERS = {};

/**
 * Adds an entity manager to the list under the given entity. A manager is only
 * added to the list once. The first manager to be added is considered the primary
 * manager.
 *
 * @param {string}          entityId The ID of the entity we want to watch.
 * @param {WPEntityManager} manager  The manager to attache to the given entity.
 * @return {boolean} True if the added entity manager is the primary manager.
 */
function addEntityManager( entityId, manager ) {
	if ( ! entityId ) {
		return true;
	}

	let isPrimary = false;
	if ( ! Array.isArray( _ENTITY_MANAGERS[ entityId ] ) ) {
		_ENTITY_MANAGERS[ entityId ] = [];
	}

	/**
	 * This basically handles two cases:
	 * 1. There is no entity tracking setup for the entityId yet. As a result,
	 *    this is the first one to be added, so it is primary.
	 * 2. There has been entity tracking setup in the past, but there are no
	 *    trackers currently assigned to the entity. As a result, this is the only
	 *    manager which currently exists, so it is primary.
	 */
	if ( _ENTITY_MANAGERS[ entityId ].length === 0 ) {
		isPrimary = true;
	}

	if (
		! _ENTITY_MANAGERS[ entityId ].some( ( { id } ) => id === manager.id )
	) {
		_ENTITY_MANAGERS[ entityId ].push( manager );
	}
	return isPrimary;
}

/**
 * Removes a manager from the list. Does nothing if the manager does not exist.
 * Once a manager is removed, the first manager in the list is informed that it
 * is the manager via the `setAsPrimary` callback. Note that this callback is
 * only called if the removed manager was the primary manager. It is not called
 * if the old primary manager is still the same.
 *
 * @param {string} entityId  The ID of the entity the manager is attached to.
 * @param {string} managerId The ID of the manager to remove.
 */
function removeEntityManager( entityId, managerId ) {
	// Do nothing if no trackers have been set up.
	if ( ! Array.isArray( _ENTITY_MANAGERS[ entityId ] ) ) {
		return;
	}
	const itemIndex = _ENTITY_MANAGERS[ entityId ].findIndex(
		( { id } ) => id === managerId
	);
	if ( itemIndex > -1 ) {
		// Remove the manager.
		_ENTITY_MANAGERS[ entityId ].splice( itemIndex, 1 );

		// Tell the new primary manager that it is now in charge.
		if ( itemIndex === 0 ) {
			return _ENTITY_MANAGERS[ entityId ][ 0 ]?.setAsPrimary( true );
		}
	}
}

/**
 * A hook which keeps track of whether we are the primary manager for a given
 * entity. When multiple components are trying to manage the same entity via this
 * hook, the hook keeps everything organized. Only one component is allowed to
 * manager an entity. This hook returns true when the component (identified by
 * `managerId`) is the primary manager for the entity.
 *
 * In practice, if this returns true, it means that the component has permission
 * to update and sync changes in/out of the block editor to the entity via the
 * inner block controller mechanism.
 *
 * If no entity ID is passed, it's assumed that there is no need to keep track
 * of multiple entitys per manager. For example, the root block-editor would not
 * pass a clientId because there is no need for it to share management with
 * multiple different components.
 *
 * However, a template part may need to share management of a single entity with
 * multiple components when there are multiple template part blocks which each
 * reference the same template part entity. In that case, it is important that
 * only one component is in charge of handling syncs from the entity to the block
 * editor.
 *
 * @param {string=} [entityId] A unique identifier for the entity to manage. If
 *                             no entity ID is given, it is assumed that we are
 *                             always the primary manager.
 * @param {string} managerId   The ID to use for the entity manager.
 */
export default function useEntityManager( entityId, managerId ) {
	/**
	 * This method sets that we are now the tracker. It is called when a different
	 * primary manager has been removed to let this manager know that it is now
	 * in charge.
	 *
	 * @type {setAsPrimary}
	 */
	const setAsPrimary = ( isPrimary ) => setIsPrimary( isPrimary );

	const [ isPrimaryManager, setIsPrimary ] = useState( () =>
		addEntityManager( entityId, {
			id: managerId,
			setAsPrimary,
		} )
	);

	const oldEntityId = useRef( entityId );
	const oldManagerId = useRef( managerId );

	useEffect( () => {
		const didEntityChange = oldEntityId.current !== entityId;
		const didClientIdChange = oldManagerId.current !== managerId;
		// If the info changed, we need to reset the tracker information.
		if ( didEntityChange || didClientIdChange ) {
			removeEntityManager( oldEntityId.current, oldManagerId.current );
			const isNewPrimary = addEntityManager( entityId, {
				id: managerId,
				setAsPrimary,
			} );
			setIsPrimary( isNewPrimary );
			oldEntityId.current = entityId;
			oldManagerId.current = managerId;
		}
		// Remove the manager on component unmount.
		return () => removeEntityManager( entityId, managerId );
	}, [ entityId, managerId ] );

	return {
		isPrimaryManager,
		primaryManagerId: _ENTITY_MANAGERS[ entityId ]?.[ 0 ]?.id,
	};
}
