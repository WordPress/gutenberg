/**
 * Internal dependencies
 */
import { DEFAULT_ENTITY_KEY } from '../entities';

const getRecordId = ( entity, record ) => {
	const entityIdKey = entity.key || DEFAULT_ENTITY_KEY;
	return record[ entityIdKey ];
};

export default getRecordId;
