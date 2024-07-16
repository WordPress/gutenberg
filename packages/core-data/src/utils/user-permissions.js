export const ALLOWED_RESOURCE_ACTIONS = [
	'create',
	'read',
	'update',
	'delete',
];

export function getUserPermissionsFromResponse( response ) {
	const permissions = {};

	// Optional chaining operator is used here because the API requests don't
	// return the expected result in the React native version. Instead, API requests
	// only return the result, without including response properties like the headers.
	const allowedMethods = response.headers?.get( 'allow' ) || '';

	const methods = {
		create: 'POST',
		read: 'GET',
		update: 'PUT',
		delete: 'DELETE',
	};
	for ( const [ actionName, methodName ] of Object.entries( methods ) ) {
		permissions[ actionName ] = allowedMethods.includes( methodName );
	}

	return permissions;
}

export function getUserPermissionCacheKey( action, resource, id ) {
	const key = (
		typeof resource === 'object'
			? [ action, resource.kind, resource.name, resource.id ]
			: [ action, resource, id ]
	)
		.filter( Boolean )
		.join( '/' );

	return key;
}
