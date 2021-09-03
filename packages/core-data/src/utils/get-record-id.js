/**
 * Internal dependencies
 */
import { DEFAULT_ENTITY_KEY } from '../entities';

export default function getRecordId( entity, record ) {
	const entityIdKey = entity.key || DEFAULT_ENTITY_KEY;
	return record[ entityIdKey ];
}
