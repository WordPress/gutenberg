/**
 * The prefix used for local-only staged entity record IDs.
 */
export const STAGED_ID_PREFIX = '__staged__';

/**
 * Checks if an ID is a local-only staged ID.
 *
 * @param {string|number} id The ID to check.
 * @return {boolean} True if the ID is a staged ID.
 */
export function isStagedId( id ) {
	return typeof id === 'string' && id.startsWith( STAGED_ID_PREFIX );
}
