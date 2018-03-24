export function registerPlugin( name, settings = {} ) {
	return {
		type: 'REGISTER_PLUGIN',
		name,
		settings,
	};
}

export function unregisterPlugin( name ) {
	return {
		type: 'UNREGISTER_PLUGIN',
		name,
	};
}
