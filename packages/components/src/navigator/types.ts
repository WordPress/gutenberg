/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ReactNode } from 'react';

type NavigatorLocationOptions = {
	isBack?: boolean;
};

export type NavigatorLocation = NavigatorLocationOptions & {
	path?: string;
};

export type NavigatorContext = {
	location: NavigatorLocation;
	setLocation: ( location: NavigatorLocation ) => void;
	isAnimating: boolean;
	setIsAnimating: ( isAnimating: boolean ) => void;
};

// Returned by the `useNavigator` hook
export type Navigator = {
	push: ( path: string, options: NavigatorLocationOptions ) => void;
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
