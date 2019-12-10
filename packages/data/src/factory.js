/**
 * Internal dependencies
 */
import defaultRegistry from './default-registry';

/** @typedef {import('./registry').WPDataRegistry} WPDataRegistry */

/**
 * Mark a selector as a registry selector.
 *
 * @param {Function} registrySelector Function receiving a registry object and returning a state selector.
 *
 * @return {Function} marked registry selector.
 */
export function createRegistrySelector( registrySelector ) {
	const selector = ( ...args ) => registrySelector( selector.registry.select )( ...args );

	/**
	 * Flag indicating to selector registration mapping that the selector should
	 * be mapped as a registry selector.
	 *
	 * @type {boolean}
	 */
	selector.isRegistrySelector = true;

	/**
	 * Registry on which to call `select`, stubbed for non-standard usage to
	 * use the default registry.
	 *
	 * @type {WPDataRegistry}
	 */
	selector.registry = defaultRegistry;

	return selector;
}

/**
 * Mark a control as a registry control.
 *
 * @param {Function} registryControl Function receiving a registry object and returning a control.
 *
 * @return {Function} marked registry control.
 */
export function createRegistryControl( registryControl ) {
	registryControl.isRegistryControl = true;

	return registryControl;
}
