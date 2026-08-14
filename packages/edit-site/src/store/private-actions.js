export function registerRoute( route ) {
	return {
		type: 'REGISTER_ROUTE',
		route,
	};
}

export function unregisterRoute( name ) {
	return {
		type: 'UNREGISTER_ROUTE',
		name,
	};
}
