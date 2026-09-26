import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import type { IconType } from '@wordpress/components';
import type { ComplementaryAreaToggleProps } from '../complementary-area-toggle/types';

export type ComplementaryAreaTransition = {
	type: 'tween';
	duration: number;
	ease: number[];
};

export type ComplementaryAreaSlotProps = {
	/**
	 * The scope of the complementary area e.g: "core",
	 * "myplugin/custom-screen-a".
	 */
	scope: string;
};

export type ComplementaryAreaFillProps = {
	activeArea?: string | null;
	isActive: boolean;
	scope: string;
	children?: ReactNode;
	className?: string;
	id: string;
	render?: ReactElement< HTMLAttributes< HTMLElement > >;
};

export type ComplementaryAreaProps = {
	/**
	 * The content to be displayed within the complementary area.
	 */
	children?: ReactNode;
	/**
	 * A className passed to the complementary area container.
	 */
	className?: string;
	/**
	 * Label of the button that allows to close the complementary area.
	 *
	 * @default "Close plugin"
	 */
	closeLabel?: string;
	/**
	 * Identifier of the complementary area, saved on the store to tell which
	 * of the sidebars is active. Defaults to the plugin name joined with `name`.
	 */
	identifier?: string;
	/**
	 * A custom header, replacing the default title and pin button.
	 */
	header?: ReactNode;
	/**
	 * A className passed to the header container.
	 */
	headerClassName?: string;
	/**
	 * The icon to render. Defaults to the icon of the plugin.
	 */
	icon?: IconType | null;
	/**
	 * Whether to allow to pin sidebar to the toolbar. When set to `true` it
	 * also automatically renders a corresponding menu item.
	 *
	 * @default true
	 */
	isPinnable?: boolean;
	/**
	 * Name of the complementary area, joined with the plugin name from the
	 * context to form the identifier. Use `identifier` for a custom one.
	 */
	name?: string;
	/**
	 * A className passed to the panel that contains the contents of the sidebar.
	 */
	panelClassName?: string;
	/**
	 * An element replacing the default `div` container. Its `className` and
	 * `style` are composed with the container's own.
	 */
	render?: ReactElement< HTMLAttributes< HTMLElement > >;
	/**
	 * The scope of the complementary area e.g: "core",
	 * "myplugin/custom-screen-a".
	 */
	scope: string;
	/**
	 * Human friendly title of the complementary area.
	 */
	title: string;
	/**
	 * Keyboard shortcut that allows opening and closing the area, also shown
	 * on the button that does the same.
	 */
	toggleShortcut?: ComplementaryAreaToggleProps[ 'shortcut' ];
	/**
	 * Whether the area opens on large viewports when no area is active yet.
	 */
	isActiveByDefault?: boolean;
};
