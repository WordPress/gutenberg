/**
 * Returns an action object used in signalling that the request for a given
 * data type has been made.
 *
 * @param {string}  dataType Data type requested.
 * @param {?string} subType  Optional data sub-type.
 *
 * @return {Object} Action object.
 */
export function setRequested( dataType, subType ) {
	return {
		type: 'SET_REQUESTED',
		dataType,
		subType,
	};
}

/**
 * Returns an action object used in signalling that terms have been received
 * for a given taxonomy.
 *
 * @param {string}   taxonomy Taxonomy name.
 * @param {Object[]} terms    Terms received.
 *
 * @return {Object} Action object.
 */
export function receiveTerms( taxonomy, terms ) {
	return {
		type: 'RECEIVE_TERMS',
		taxonomy,
		terms,
	};
}
