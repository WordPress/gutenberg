/**
 * Internal dependencies
 */
import { ENTITY_DUPLICATE_INSTANCE, ENTITY_FIRST_INSTANCE } from './constants';

const ENTITY_INSTANCES = {};

export function setupEntityInstance( entityId, instanceId ) {
	if ( ! entityId || ! instanceId ) {
		return;
	}
	if ( ! ENTITY_INSTANCES[ entityId ] ) {
		ENTITY_INSTANCES[ entityId ] = {};
		ENTITY_INSTANCES[ entityId ][ instanceId ] = ENTITY_FIRST_INSTANCE;
	} else {
		ENTITY_INSTANCES[ entityId ][ instanceId ] = ENTITY_DUPLICATE_INSTANCE;
	}
}

export function removeEntityInstance( entityId, instanceId ) {
	if (
		entityId &&
		instanceId &&
		ENTITY_INSTANCES[ entityId ]?.[ instanceId ]
	) {
		delete ENTITY_INSTANCES[ entityId ][ instanceId ];
	}
}

export function isDuplicateEntityInstance( entityId, instanceId ) {
	return (
		entityId &&
		instanceId &&
		ENTITY_INSTANCES[ entityId ]?.[ instanceId ] ===
			ENTITY_DUPLICATE_INSTANCE
	);
}
