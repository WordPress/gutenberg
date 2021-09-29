/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
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
	// TODO: JSDoc comments
	initialPath: string;
	children: ReactNode;
};

export type NavigatorScreenProps = {
	path: string;
	children: ReactNode;
};
