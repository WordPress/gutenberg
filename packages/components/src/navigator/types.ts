/**
 * External dependencies
 */
import type { ReactNode } from 'react';

type NavigatorPathOptions = {
	isBack?: boolean;
};

export type NavigatorPath = NavigatorPathOptions & {
	path?: string;
};

export type NavigatorContext = [
	NavigatorPath,
	( path: NavigatorPath ) => void
];

// Returned by the `useNavigator` hook
export type Navigator = {
	push: ( path: string, options: NavigatorPathOptions ) => void;
};

export type NavigatorProviderProps = {
	/**
	 * The initial active path.
	 */
	initialPath: string;
	/**
	 * The children elements.
	 */
	children: ReactNode;
};

export type NavigatorScreenProps = {
	/**
	 * The screen's path, matched against the current path stored in the navigator.
	 */
	path: string;
	/**
	 * The children elements.
	 */
	children: ReactNode;
};
