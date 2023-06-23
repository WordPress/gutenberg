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
	focusTargetSelector?: string;
	isBack?: boolean;
	skipFocus?: boolean;
};

export type NavigatorLocation = NavigateOptions & {
	isInitial?: boolean;
	path?: string;
	hasRestoredFocus?: boolean;
};

// Returned by the `useNavigator` hook.
export type Navigator = {
	location: NavigatorLocation;
	params: MatchParams;
	goTo: ( path: string, options?: NavigateOptions ) => void;
	goBack: () => void;
	goToParent: () => void;
};

export type NavigatorContext = Navigator & {
	addScreen: ( screen: Screen ) => void;
	removeScreen: ( screen: Screen ) => void;
	match?: string;
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
	/**
	 * The aria-role attributed to the screen.
	 *
	 * @default 'region'
	 */
	role?: React.HTMLAttributes< Element >[ 'role' ];
	/**
	 * The text labelling the screen element. When this prop is not defined, the
	 * `aria-labelledby` prop should be defined instead.
	 */
	'aria-label'?: React.HTMLAttributes< Element >[ 'aria-label' ];
	/**
	 * The id of another element used to label this screen element. When this prop
	 * is not defined, the `aria-label` prop should be defined instead.
	 */
	'aria-labelledby'?: React.HTMLAttributes< Element >[ 'aria-labelledby' ];
};

export type NavigatorBackButtonProps = ButtonAsButtonProps;

export type NavigatorBackButtonHookProps = NavigatorBackButtonProps & {
	/**
	 * Whether we should navigate to the parent screen.
	 *
	 * @default 'false'
	 */
	goToParent?: boolean;
};

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
