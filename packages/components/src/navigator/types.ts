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

export type NavigatorBackButtonProps = {
	/**
	 * The children elements.
	 */
	children: ReactNode;
	/**
	 * The callback called in response to a `click` event.
	 */
	onClick?: React.MouseEventHandler< HTMLElement >;
};

export type NavigatorButtonProps = NavigatorBackButtonProps & {
	/**
	 * The path of the screen to navigate to. The value of this prop needs to be
	 * a valid value for an HTML attribute.
	 */
	path: string;
	/**
	 * The HTML attribute used to identify the `NavigatorButton`, which is used
	 * by `Navigator` to restore focus.
	 *
	 * @default 'id'
	 */
	attributeName?: string;
};
