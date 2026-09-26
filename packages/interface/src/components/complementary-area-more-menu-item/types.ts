import type { ComplementaryAreaToggleProps } from '../complementary-area-toggle/types';

export type DefaultComplementaryAreaMoreMenuItemProps =
	ComplementaryAreaToggleProps & {
		/**
		 * Name of the complementary area, joined with the plugin name from
		 * the context to form the identifier. Use `identifier` for a custom one.
		 */
		target?: string;
	};

export type ComplementaryAreaMoreMenuItemProps =
	DefaultComplementaryAreaMoreMenuItemProps & {
		__unstableExplicitMenuItem?: boolean;
		__unstableTarget?: string;
	};
