/*
 * Types for `use-convert-to-navigation-links.js`, so TypeScript modules can
 * import it. The build tsconfig only includes `.ts` and `.tsx` files, and
 * importing a `.js` file from one is an error. Keep in sync with
 * `use-convert-to-navigation-links.js`; remove this file once that module is
 * converted to TypeScript.
 */
import type { Block } from '@wordpress/blocks';

/**
 * Converts a flat list of pages into a nested list of navigation link and
 * submenu blocks.
 *
 * @param pages        An array of pages.
 * @param parentPageID When set, only the children of this page are returned.
 * @return A nested array of navigation link blocks.
 */
export declare function convertToNavigationLinks(
	pages?: Record< string, any >[],
	parentPageID?: number | null
): Block[];

export declare function useConvertToNavigationLinks( props: {
	clientId: string;
	pages: Record< string, any >[];
	parentClientId: string;
	parentPageID?: number | null;
} ): () => void;
