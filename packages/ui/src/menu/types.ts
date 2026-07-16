import type { Menu as _Menu } from '@base-ui/react/menu';
import type { ElementType, ReactElement, ReactNode } from 'react';

import type { ComponentProps } from '../utils/types';

export type PortalProps = ComponentProps< typeof _Menu.Portal >;

export type PositionerProps = ComponentProps< typeof _Menu.Positioner >;

export type RootProps< Payload = unknown > = _Menu.Root.Props< Payload >;

export type TriggerProps< Payload = unknown > = _Menu.Trigger.Props< Payload >;

export type SubmenuRootProps = _Menu.SubmenuRoot.Props;

export type RadioGroupProps = _Menu.RadioGroup.Props;

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

export interface MenuItemShortcut {
	/**
	 * The human-readable representation of the shortcut, displayed in the menu
	 * item. Use platform-appropriate symbols (e.g., "⌘S" on macOS, "Ctrl+S" on
	 * Windows).
	 */
	displayShortcut: string;

	/**
	 * The shortcut in a format compatible with the
	 * [aria-keyshortcuts](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-keyshortcuts)
	 * attribute. Use "+" to separate keys and standard key names
	 * (e.g., "Meta+S", "Control+Shift+P").
	 */
	ariaKeyShortcut: string;

	/**
	 * A human-readable description of the shortcut, announced as part of the
	 * item's accessible description.
	 */
	description: string;
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
	shortcut?: MenuItemShortcut;
}

export interface ItemLabelProps extends ComponentProps< 'span' > {
	/**
	 * The primary label for a menu item.
	 */
	children?: ReactNode;
}

export interface ItemDescriptionProps extends ComponentProps< 'span' > {
	/**
	 * Supplementary text displayed below a menu item label.
	 */
	children?: ReactNode;
}

type MenuItemComponentProps< T extends ElementType > = Omit<
	ComponentProps< T >,
	keyof MenuItemLayoutProps
>;

export type ItemProps = MenuItemComponentProps< typeof _Menu.Item > &
	MenuItemLayoutProps & {
		/**
		 * The content to be rendered inside the menu item.
		 */
		children?: ReactNode;
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
		 * The content to be rendered inside the link menu item.
		 */
		children?: ReactNode;
	};

export type CheckboxItemProps = MenuItemComponentProps<
	typeof _Menu.CheckboxItem
> &
	MenuItemLayoutProps & {
		/**
		 * The content to be rendered inside the checkbox menu item.
		 */
		children?: ReactNode;
	};

export type RadioItemProps = MenuItemComponentProps< typeof _Menu.RadioItem > &
	MenuItemLayoutProps & {
		/**
		 * The content to be rendered inside the radio menu item.
		 */
		children?: ReactNode;
	};

export type SubmenuTriggerProps = MenuItemComponentProps<
	typeof _Menu.SubmenuTrigger
> &
	MenuItemLayoutProps & {
		/**
		 * The content to be rendered inside the submenu trigger item.
		 */
		children?: ReactNode;
	};
