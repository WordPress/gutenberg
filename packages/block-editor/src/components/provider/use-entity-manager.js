/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

const _ENTITY_MANAGERS = {};

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
		const newManager = _ENTITY_MANAGERS[ entityId ][ 0 ];
		if ( newManager ) {
			newManager.setAsPrimary( true );
		}
	}
}

// Returns true if we are the current tracker for the given entity.
// Basically only returns true if no entityId is given.
export default function useIsPrimaryEntityManager( entityId, clientId ) {
	// Set up a method for setting that we are now the tracker. Note that this
	// should only trigger a re-render if the tracker status actually changes.
	const setAsPrimary = ( isPrimary ) => setIsTracker( isPrimary );

	const isPrimary = addEntityManager( entityId, {
		id: clientId,
		setAsPrimary,
	} );

	const [ isTracker, setIsTracker ] = useState( isPrimary );

	const oldEntityId = useRef( entityId );
	const oldClientId = useRef( clientId );

	useEffect( () => {
		const didEntityChange = oldEntityId.current !== clientId;
		const didClientIdChange = oldClientId.current !== clientId;
		// If the info changed, we need to reset the tracker information.
		if ( didEntityChange || didClientIdChange ) {
			removeEntityManager( oldEntityId.current, oldClientId.current );
			const isNewPrimary = addEntityManager( {
				id: clientId,
				setAsPrimary,
			} );
			setIsTracker( isNewPrimary );
			oldEntityId.current = entityId;
			oldClientId.current = clientId;
		}
		// Remove the manager on component unmount.
		return () => removeEntityManager( entityId, clientId );
	}, [ entityId, clientId ] );

	return isTracker;
}
