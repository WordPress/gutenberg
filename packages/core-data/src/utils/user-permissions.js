export const ALLOWED_RESOURCE_ACTIONS = [
	'create',
	'read',
	'update',
	'delete',
];

export function getUserPermissionsFromAllowHeader( allowedMethods ) {
	const permissions = {};
	if ( ! allowedMethods ) {
		return permissions;
	}

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
