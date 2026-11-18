/*
 * Types for `constants.js`, so TypeScript modules can import it. The build
 * tsconfig only includes `.ts` and `.tsx` files, and importing a `.js` file
 * from one is an error. Keep in sync with `constants.js`; remove this file
 * once that module is converted to TypeScript.
 */

export declare const DEFAULT_BLOCK: {
	name: string;
	attributes: {
		kind: string;
		type: string;
	};
};

export declare const PRIORITIZED_INSERTER_BLOCKS: string[];

export declare const PRELOADED_NAVIGATION_MENUS_QUERY: {
	per_page: number;
	status: string[];
	order: string;
	orderby: string;
};

export declare const SELECT_NAVIGATION_MENUS_ARGS: [
	string,
	string,
	typeof PRELOADED_NAVIGATION_MENUS_QUERY,
];

/**
 * Template part area identifier for navigation overlays.
 */
export declare const NAVIGATION_OVERLAY_TEMPLATE_PART_AREA: string;
