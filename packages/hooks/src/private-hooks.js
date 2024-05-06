// Define a list of "private hooks" that only core packages can use. This is
// implemented by producing Symbols from these hook names, the access to which
// will be mediated by the lock/unlock interface.
//
// Note that the standard Hooks API only accepts valid strings as hook names,
// but an exception will be made for Symbols on this list.
//
// @see validateHookName.
const privateHooks = [
	'postActions.renamePost',
	'pagePages.renamePost',
	'pagePages.editPost',
];

// Used by consumers of the hooks API
//
// @example
// ```js
// const { privateHooksMap } = unlock( privateApis );
// const MY_HOOK = privateHooksMap.get( 'myHook' );
// doAction( MY_HOOK );
// ```
export const privateHooksMap = new Map(
	privateHooks.map( ( label ) => [ label, Symbol( label ) ] )
);

export const privateHooksSet = new Set( privateHooksMap.values() );
