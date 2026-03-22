/**
 * External dependencies
 */

import type { WPCommandConfig, WPCommandLoaderConfig } from './actions';

export interface State {
	commands: Record< string, WPCommandConfig >;
	commandLoaders: Record< string, WPCommandLoaderConfig >;
	isOpen: boolean;
	context: string;
}
