import type { AriaRole, ElementType } from 'react';
import type { IconType } from '@wordpress/components';

export type ComplementaryAreaToggleProps = {
	/**
	 * A component used to render the toggle, e.g. `MenuItem` or a custom one.
	 *
	 * @default Button
	 */
	as?: ElementType;
	/**
	 * The scope of the complementary area e.g: "core",
	 * "myplugin/custom-screen-a".
	 */
	scope: string;
	/**
	 * Identifier of the complementary area. Defaults to the `name` of the
	 * plugin from the context (when available) joined with the `name` prop.
	 */
	identifier?: string;
	/**
	 * The icon to render. Defaults to the icon of the plugin.
	 */
	icon?: IconType | null;
	/**
	 * An icon to use when the complementary area is open e.g: a check mark.
	 * Falls back to the icon of the complementary area or of the plugin.
	 */
	selectedIcon?: IconType;
	/**
	 * Name of the complementary area, joined with the plugin name from the
	 * context to form the identifier. Use `identifier` for a custom one.
	 */
	name?: string;
	/**
	 * Keyboard shortcut passed to the rendered component.
	 */
	shortcut?: string | { display: string; ariaLabel: string };
	/**
	 * The role of the rendered component. Roles that support a checked state
	 * get `aria-checked` set when the complementary area is open.
	 */
	role?: AriaRole;
	/**
	 * The props not referred above are passed to the rendered component.
	 */
	[ key: string ]: unknown;
};
