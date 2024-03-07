/**
 * Register an external source
 *
 * @param {string} source Name of the source to register.
 */
export function registerBindingsSource( source ) {
	return {
		type: 'REGISTER_BINDINGS_SOURCE',
		name: source.name,
		label: source.label,
		connect: source.connect,
	};
}
