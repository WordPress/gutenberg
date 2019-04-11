/**
 * Get a JSON response for the passed in object, for use with `request.respond`.
 *
 * @param {Object} obj Object to seralise for response.
 * @return {Object} Response for use with `request.respond`.
 */
export function getJSONResponse( obj ) {
	return {
		content: 'application/json',
		body: JSON.stringify( obj ),
	};
}
