import { PluginRegistry } from './plugin';
import { PluginSidebarFill as PluginSidebar } from '../components/plugin-sidebar';

const registry = PluginRegistry.getInstance();

const __experimental = {
	registerPlugin: registry.registerPlugin,
	getRegisteredUIComponent: registry.getRegisteredUIComponent,
	PluginSidebar,
};

export {
	__experimental,
};
