/**
 * Internal dependencies
 */
import PluginRegistry from './plugin';

const registry = PluginRegistry.getInstance();

const __experimental = {
	registerPlugin: registry.registerPlugin,
	getRegisteredUIComponent: registry.getRegisteredUIComponent,
};

export {
	__experimental,
};
