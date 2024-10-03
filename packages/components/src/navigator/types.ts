/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { ButtonAsButtonProps } from '../button/types';

export type MatchParams = Record< string, string | string[] >;

export type NavigateOptions = {
	/**
	 * Specify the CSS selector used to restore focus on an given element when
	 * navigating back. When not provided, the component will attempt to restore
	 * focus on the element that originated the forward navigation.
	 */
	focusTargetSelector?: string;
	/**
	 * Whether the navigation is a backwards navigation. This enables focus
	 * restoration (when possible), and causes the animation to be backwards.
	 */
	isBack?: boolean;
	/**
	 * Opt out of focus management. Useful when the consumer of the component
	 * wants to manage focus themselves.
	 */
	skipFocus?: boolean;
	/**
	 * Note: this option is deprecated and currently doesn't have any effect.
	 * @deprecated
	 * @ignore
	 */
	replace?: boolean;
};

export type NavigateToParentOptions = Omit< NavigateOptions, 'isBack' >;

export type NavigatorLocation = NavigateOptions & {
	/**
	 * Whether the current location is the initial one (ie. first in the stack).
	 */
	isInitial?: boolean;
	/**
	 * The path associated to the location.
	 */
	path?: string;
	/**
	 * Whether focus was already restored for this location (in case of
	 * backwards navigation).
	 */
	hasRestoredFocus?: boolean;
};

// Returned by the `useNavigator` hook.
export type Navigator = {
	/**
	 * The current location.
	 */
	location: NavigatorLocation;
	/**
	 * Params associated with the current location
	 */
	params: MatchParams;
	/**
	 * Navigate to a new location.
	 */
	goTo: ( path: string, options?: NavigateOptions ) => void;
	/**
	 * Go back to the parent location (ie. "/some/path" will navigate back
	 * to "/some")
	 */
	goBack: ( options?: NavigateToParentOptions ) => void;
	/**
	 * _Note: This function is deprecated. Please use `goBack` instead._
	 * @deprecated
	 * @ignore
	 */
	goToParent: ( options?: NavigateToParentOptions ) => void;
};

export type NavigatorContext = Navigator & {
	addScreen: ( screen: Screen ) => void;
	removeScreen: ( screen: Screen ) => void;
	match?: string;
};

export type NavigatorProps = {
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
	 *
	 * `Navigator` assumes that screens are organized hierarchically according
	 * to their `path`, which should follow a URL-like scheme where each path
	 * segment starts with and is separated by the `/` character.
	 *
	 * `Navigator` will treat "back" navigations as going to the parent screen —
	 * it is, therefore, the responsibility of the consumer of the component to
	 * create the correct screen hierarchy.
	 *
	 * For example:
	 *  - `/` is the root of all paths. There should always be a screen with
	 *    `path="/"`;
	 *  - `/parent/child` is a child of `/parent`;
	 *  - `/parent/child/grand-child` is a child of `/parent/child`;
	 *  - `/parent/:param` is a child of `/parent` as well;
	 *  - if the current screen has a `path="/parent/child/grand-child"`, when
	 *    going "back" `Navigator` will try to recursively navigate the path
	 *    hierarchy until a matching screen (or the root `/`) is found.
	 */
	path: string;
	/**
	 * The children elements.
	 */
	children: ReactNode;
};

export type NavigatorBackButtonProps = ButtonAsButtonProps;

export type NavigatorToParentButtonProps = NavigatorBackButtonProps;

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

export type Screen = {
	id: string;
	path: string;
};
