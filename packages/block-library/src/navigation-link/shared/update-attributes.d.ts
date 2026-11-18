/*
 * Types for `update-attributes.js`, so TypeScript modules can import it. The
 * build tsconfig only includes `.ts` and `.tsx` files, and importing a `.js`
 * file from one is an error. Keep in sync with `update-attributes.js`; remove
 * this file once that module is converted to TypeScript.
 */

export type WPNavigationLinkKind =
	'post-type' | 'custom' | 'taxonomy' | 'post-type-archive';

export interface WPNavigationLinkBlockAttributes {
	/** Link text. */
	label?: string;
	/** Differentiates between term and post ids to check post draft status. */
	kind?: WPNavigationLinkKind | string;
	/** The type such as post, page, tag, category and other custom types. */
	type?: string;
	/** The relationship of the linked URL. */
	rel?: string;
	/** A post or term id. */
	id?: number;
	/** Sets link target to _blank when true. */
	opensInNewTab?: boolean;
	/** Link href. */
	url?: string;
	/** Link title attribute. */
	title?: string;
}

/**
 * Link Control onChange handler that updates block attributes when a setting
 * is changed.
 *
 * @param updatedValue    New block attributes to update.
 * @param setAttributes   Block attribute update function.
 * @param blockAttributes Current block attributes.
 */
export declare const updateAttributes: (
	updatedValue: Record< string, any > | undefined,
	setAttributes: ( attributes: Record< string, any > ) => void,
	blockAttributes?: WPNavigationLinkBlockAttributes
) => {
	isEntityLink: boolean;
	attributes: WPNavigationLinkBlockAttributes & Record< string, any >;
};
