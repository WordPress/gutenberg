export default function parseEntityName( name = '' ) {
	const [ postType, key, revisions ] = (
		typeof name === 'string' ? name : ''
	)?.split( ':' );

	return {
		name: postType,
		key,
		isRevision: revisions === 'revisions',
	};
}
