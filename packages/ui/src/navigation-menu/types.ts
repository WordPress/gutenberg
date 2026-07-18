import type { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import type {
	CSSProperties,
	ElementType,
	ReactElement,
	ReactNode,
} from 'react';
import type { ItemLayoutProps } from '../utils/item-layout';
import type { ComponentProps } from '../utils/types';

type RootBaseProps< Value > = Omit<
	_NavigationMenu.Root.Props< Value >,
	'className' | 'children' | 'style'
>;

export type RootProps< Value = unknown > = RootBaseProps< Value > & {
	/**
	 * CSS class name to apply to the root element.
	 */
	className?: string;

	/**
	 * CSS style to apply to the root element.
	 */
	style?: CSSProperties;

	/**
	 * Navigation menu parts rendered within this root.
	 */
	children?: ReactNode;
};

export type ListProps = ComponentProps< typeof _NavigationMenu.List > & {
	children?: ReactNode;
};

export type ItemProps = ComponentProps< typeof _NavigationMenu.Item > & {
	children?: ReactNode;
};

type NavigationItemComponentProps< T extends ElementType > = Omit<
	ComponentProps< T >,
	keyof ItemLayoutProps
>;

export type LinkProps = Omit<
	NavigationItemComponentProps< typeof _NavigationMenu.Link >,
	'active' | 'aria-current' | 'children' | 'closeOnClick' | 'href' | 'target'
> &
	ItemLayoutProps & {
		/**
		 * Native navigation target passed through to the rendered link.
		 */
		href: string;

		/**
		 * Whether this link represents the current page.
		 *
		 * @default false
		 */
		active?: boolean;

		/**
		 * Whether activating the link closes the current navigation flyout.
		 *
		 * @default false
		 */
		closeOnClick?: boolean;

		/**
		 * Whether to open the link in a new browser tab.
		 *
		 * @default false
		 */
		openInNewTab?: boolean;
	};

export type TriggerProps = Omit<
	NavigationItemComponentProps< typeof _NavigationMenu.Trigger >,
	'children'
> &
	ItemLayoutProps;

export type IconProps = ComponentProps< typeof _NavigationMenu.Icon > & {
	/**
	 * Custom decorative icon content. The standard directional chevron is used
	 * when omitted.
	 */
	children?: ReactNode;
};

export type ContentProps = ComponentProps< typeof _NavigationMenu.Content > & {
	children?: ReactNode;
};

export type PortalProps = ComponentProps< typeof _NavigationMenu.Portal >;

export type PositionerProps = ComponentProps<
	typeof _NavigationMenu.Positioner
>;

export type ViewportProps = ComponentProps< typeof _NavigationMenu.Viewport >;

export type ArrowProps = ComponentProps< typeof _NavigationMenu.Arrow > & {
	children?: ReactNode;
};

export type BackdropProps = ComponentProps< typeof _NavigationMenu.Backdrop >;

export interface PopupProps
	extends Omit< ComponentProps< typeof _NavigationMenu.Popup >, 'children' > {
	/**
	 * The viewport, optional arrow, and any advanced popup content.
	 */
	children?: ReactNode;

	/**
	 * Optional portal element. When omitted, `NavigationMenu.Popup` uses
	 * `NavigationMenu.Portal` with default props.
	 */
	portal?: ReactElement< Omit< PortalProps, 'children' > >;

	/**
	 * Optional positioner element. When omitted, `NavigationMenu.Popup` uses
	 * `NavigationMenu.Positioner` with orientation-aware defaults.
	 */
	positioner?: ReactElement< Omit< PositionerProps, 'children' > >;

	/**
	 * Optional backdrop element, or `false` to explicitly disable one.
	 * No backdrop is rendered by default.
	 */
	backdrop?: ReactElement< Omit< BackdropProps, 'children' > > | false;
}
