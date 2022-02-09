/**
 * External dependencies
 */
import type { ReactNode } from 'react';

type NavigateOptions = {
	focusTargetSelector?: string;
};

export type NavigatorLocation = NavigateOptions & {
	isInitial?: boolean;
	isBack?: boolean;
	path?: string;
};

export type NavigatorContext = {
	location: NavigatorLocation;
	goTo: ( path: string, options?: NavigateOptions ) => void;
	goBack: () => void;
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

export type NavigatorBackLinkProps = {
	/**
	 * The children elements.
	 */
	children: ReactNode;
	/**
	 * The callback called in response to a `click` event.
	 */
	onClick?: React.MouseEventHandler< HTMLElement >;
};

export type NavigatorLinkProps = NavigatorBackLinkProps & {
	/**
	 * The path of the screen to navigate to.
	 */
	path: string;
	/**
	 * The HTML attribute used to identify the `NavigatorLink`, which is used
	 * by `Navigator` to restore focus.
	 *
	 * @default 'id'
	 */
	attributeName?: string;
};
