import { registerPlugin, getRegisteredUIComponent } from './plugin';
import { PluginSidebarFill as PluginSidebar } from './components/plugin-sidebar';

const __experimental = {
	registerPlugin,
	PluginSidebar,
	getRegisteredUIComponent,
};

export {
	__experimental,
};
