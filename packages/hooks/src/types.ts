/**
 * Internal dependencies
 */
export type { Hooks } from './createHooks';

export type Callback = ( ...args: any[] ) => any;

export type Handler = {
	callback: Callback;
	namespace: string;
	priority: number;
};

export type Hook = {
	handlers: Handler[];
	runs: number;
};

export type Current = {
	name: string;
	currentIndex: number;
};

export type HookInfo = {
	name: string;
	currentIndex: number;
};

export type Store = Record< string, Hook > & { __current: Set< Current > };

export type StoreKey = 'actions' | 'filters';
