/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ReactNode } from 'react';

type NavigateOptions = {
	navigationTriggerElement?: unknown;
};

export type NavigatorLocation = {
	isBack?: boolean;
	path?: string;
	navigationTriggerElement?: unknown;
};

export type NavigatorContext = {
	location: NavigatorLocation;
	push: ( path: string, options: NavigateOptions ) => void;
	pop: () => void;
};

// Returned by the `useNavigator` hook
export type Navigator = NavigatorContext;

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
