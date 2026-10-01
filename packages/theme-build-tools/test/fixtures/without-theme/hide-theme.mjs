// Node module resolution hook that makes `@wordpress/theme` unresolvable, as if
// the optional peer dependency were not installed.
export async function resolve( specifier, context, nextResolve ) {
	if ( specifier.startsWith( '@wordpress/theme/' ) ) {
		throw Object.assign(
			new Error( `Cannot find package '${ specifier }'` ),
			{ code: 'ERR_MODULE_NOT_FOUND' }
		);
	}
	return nextResolve( specifier, context );
}
