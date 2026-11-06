import type { Route } from '../../store/types';

export interface AdminShellPage {
	/** Page key, the `page` query argument (or file name for Core pages). */
	pageKey: string;
	/** Admin URL of the page, as linked from the admin menu. */
	url: string;
	/** ID of the element the page's app mounts into. */
	mountId: string;
	/** Page title, as shown in the admin menu and document title. */
	title: string;
	/** The page's `$hook_suffix`, which wp-admin adds as a body class. */
	bodyClass: string;
	/** The page's routes. */
	routes: Route[];
	/** Init modules the page runs before its app renders. */
	initModules?: string[];
	/**
	 * REST path that returns the responses the page preloads on its own page
	 * load, to preload them before the shell mounts the page.
	 */
	preloadPath?: string;
}

export interface AdminShellPageChangeDetail {
	/** Page now showing. */
	pageKey: string;
	/** Page shown before. */
	previousPageKey: string;
	/** Pages whose apps are mounted, most recently shown last. */
	alivePageKeys: string[];
}
