/**
 * Parses an entity name into its component parts, assuming a string of
 * either `'name'"'` or `'name:key:subEntity'`.
 *
 * @param {string} name The name of the entity to parse.
 * @return {{name: string, isRevision: boolean, key: string}} The parsed entity name.
 */
const DEFAULT_DELIMITER = ':';

export default function parseEntityName( name = '' ) {
	const [ postType, key, subEntity ] = (
		typeof name === 'string' ? name : ''
	)?.split( DEFAULT_DELIMITER );

	return {
		name: postType || name,
		key,
		isRevision: subEntity === 'revisions',
	};
}
