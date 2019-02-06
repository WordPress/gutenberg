/**
 * Mark a function as a registry selector.
 *
 * @param {function} registrySelector Function receiving a registry object and returning a state selector.
 *
 * @return {function} marked registry selector.
 */
export function createRegistrySelector( registrySelector ) {
	registrySelector.isRegistrySelector = true;

	return registrySelector;
}
