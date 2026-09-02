import type { Menu as _Menu } from '@base-ui/react/menu';
import type { ElementType, ReactElement, ReactNode } from 'react';
import type { KeyboardShortcut } from '../utils/keyboard-shortcut';
import type { ComponentProps } from '../utils/types';

export type PortalProps = ComponentProps< typeof _Menu.Portal >;

export type PositionerProps = ComponentProps< typeof _Menu.Positioner >;

// Keep the menu vertical, expose Escape bubbling only on SubmenuRoot, and omit
// Base UI's detached-trigger handle and payload-rendering API.
export interface RootProps
	extends Pick<
		_Menu.Root.Props,
		| 'open'
		| 'onOpenChange'
		| 'onOpenChangeComplete'
		| 'defaultOpen'
		| 'modal'
		| 'loopFocus'
		| 'highlightItemOnHover'
		| 'disabled'
		| 'actionsRef'
		| 'triggerId'
		| 'defaultTriggerId'
	> {
	/**
	 * The menu subcomponents (`Menu.Trigger`, `Menu.Popup`, etc.).
	 */
	children?: ReactNode;
}

// Detached triggers require handle utilities and payload roots that Menu does
// not expose.
export type TriggerProps = Omit<
	ComponentProps< typeof _Menu.Trigger >,
	'handle' | 'payload'
> & {
	/**
	 * The content to be rendered inside the trigger.
	 */
	children?: ReactNode;
};

// Keep submenus vertical; horizontal orientation is not supported by the
// styled Menu layout.
export interface SubmenuRootProps
	extends Pick<
		_Menu.SubmenuRoot.Props,
		| 'open'
		| 'onOpenChange'
		| 'onOpenChangeComplete'
		| 'defaultOpen'
		| 'loopFocus'
		| 'highlightItemOnHover'
		| 'disabled'
		| 'closeParentOnEsc'
		| 'actionsRef'
	> {
	/**
	 * The submenu subcomponents (`Menu.SubmenuTrigger`, `Menu.Popup`, etc.).
	 */
	children?: ReactNode;
}

export type RadioGroupProps = ComponentProps< typeof _Menu.RadioGroup > & {
	/**
	 * The radio menu items in the group.
	 */
	children?: ReactNode;
};

export type GroupProps = ComponentProps< typeof _Menu.Group > & {
	/**
	 * The content to be rendered inside the group.
	 */
	children?: ReactNode;
};

export type GroupLabelProps = ComponentProps< typeof _Menu.GroupLabel > & {
	/**
	 * The content to be rendered inside the group label.
	 */
	children?: ReactNode;
};

export type SeparatorProps = ComponentProps< typeof _Menu.Separator >;

export interface PopupProps extends ComponentProps< typeof _Menu.Popup > {
	/**
	 * The content to be rendered inside the menu popup.
	 */
	children?: ReactNode;

	/**
	 * Optional portal element, typically `<Menu.Portal />` with custom
	 * `container`. When omitted, `Menu.Popup` uses `Menu.Portal` with default
	 * props. Do not pass `children` on the portal element; they would be
	 * ignored.
	 */
	portal?: ReactElement< Omit< PortalProps, 'children' > >;

	/**
	 * Optional positioner element, typically `<Menu.Positioner />` with custom
	 * positioning props (`side`, `align`, `sideOffset`, collision settings,
	 * etc.). When omitted, `Menu.Popup` uses `Menu.Positioner` with default
	 * props. Do not pass `children` on the positioner element; they would be
	 * ignored.
	 */
	positioner?: ReactElement< Omit< PositionerProps, 'children' > >;
}

export interface MenuItemLayoutProps {
	/**
	 * Presentational content displayed before the item label.
	 */
	prefix?: ReactNode;

	/**
	 * Presentational content displayed after the item label.
	 */
	suffix?: ReactNode;

	/**
	 * The keyboard shortcut associated with this item. When provided, the
	 * shortcut is displayed in the item and announced to assistive technology.
	 *
	 * **Note**: This prop is for display and accessibility purposes only; the
	 * consumer is responsible for implementing the actual keyboard event handler.
	 */
	shortcut?: KeyboardShortcut;
}

export interface ItemLabelProps extends ComponentProps< 'span' > {
	/**
	 * The primary label for a menu item. Use as the first direct child of every
	 * menu item.
	 */
	children: ReactNode;
}

export interface ItemDescriptionProps extends ComponentProps< 'span' > {
	/**
	 * Supplementary content displayed below a menu item label. Use as a direct
	 * child after `Menu.ItemLabel`. Content should be text or non-interactive
	 * inline markup.
	 */
	children: ReactNode;
}

type MenuItemChildren =
	| ReactElement< ItemLabelProps >
	| [
			ReactElement< ItemLabelProps >,
			...(
				| ReactElement< ItemDescriptionProps >
				| false
				| null
				| undefined
			)[],
	  ];

type MenuItemComponentProps< T extends ElementType > = Omit<
	ComponentProps< T >,
	keyof MenuItemLayoutProps | 'children'
>;

export type ItemProps = MenuItemComponentProps< typeof _Menu.Item > &
	MenuItemLayoutProps & {
		/**
		 * One direct `Menu.ItemLabel`, followed by zero or more direct
		 * `Menu.ItemDescription` components.
		 */
		children: MenuItemChildren;
	};

export type LinkItemProps = Omit<
	MenuItemComponentProps< typeof _Menu.LinkItem >,
	'target'
> &
	MenuItemLayoutProps & {
		/**
		 * Whether to open the link in a new browser tab.
		 * When true, sets `target="_blank"` and appends a visual arrow indicator.
		 *
		 * @default false
		 */
		openInNewTab?: boolean;

		/**
		 * One direct `Menu.ItemLabel`, followed by zero or more direct
		 * `Menu.ItemDescription` components.
		 */
		children: MenuItemChildren;
	};

export type CheckboxItemProps = MenuItemComponentProps<
	typeof _Menu.CheckboxItem
> &
	MenuItemLayoutProps & {
		/**
		 * One direct `Menu.ItemLabel`, followed by zero or more direct
		 * `Menu.ItemDescription` components.
		 */
		children: MenuItemChildren;
	};

export type RadioItemProps = MenuItemComponentProps< typeof _Menu.RadioItem > &
	MenuItemLayoutProps & {
		/**
		 * One direct `Menu.ItemLabel`, followed by zero or more direct
		 * `Menu.ItemDescription` components.
		 */
		children: MenuItemChildren;
	};

export type SubmenuTriggerProps = MenuItemComponentProps<
	typeof _Menu.SubmenuTrigger
> &
	MenuItemLayoutProps & {
		/**
		 * One direct `Menu.ItemLabel`, followed by zero or more direct
		 * `Menu.ItemDescription` components.
		 */
		children: MenuItemChildren;
	};
