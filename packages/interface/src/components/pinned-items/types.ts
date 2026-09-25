import type { ReactNode } from 'react';

export type PinnedItemsProps = {
	/**
	 * The scope of the pinned items area e.g: "core",
	 * "myplugin/custom-screen-a".
	 */
	scope: string;
	/**
	 * The content to be displayed for the pinned items. Most of the time, a
	 * button with an icon should be used.
	 */
	children?: ReactNode;
};

export type PinnedItemsSlotProps = {
	/**
	 * The scope of the pinned items area e.g: "core",
	 * "myplugin/custom-screen-a".
	 */
	scope: string;
	/**
	 * A className passed to the pinned items container.
	 */
	className?: string;
};
