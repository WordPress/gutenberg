/*
 * Types for `use-entity-binding.js`, so TypeScript modules can import it. The
 * build tsconfig only includes `.ts` and `.tsx` files, and importing a `.js`
 * file from one is an error. Keep in sync with `use-entity-binding.js`; remove
 * this file once that module is converted to TypeScript.
 */

/**
 * Builds entity binding configuration for navigation link URLs.
 *
 * @param kind The kind of entity. Only 'post-type' and 'taxonomy' are supported.
 * @return Entity binding configuration object.
 */
export declare function buildNavigationLinkEntityBinding(
	kind: 'post-type' | 'taxonomy' | string | undefined
): {
	url: {
		source: string;
		args: {
			field: string;
		};
	};
};

/**
 * Shared hook for entity binding functionality in Navigation blocks.
 *
 * @param props            Hook parameters.
 * @param props.clientId   Block client ID.
 * @param props.attributes Block attributes.
 * @return Hook return value.
 */
export declare function useEntityBinding( props: {
	clientId: string;
	attributes: Record< string, any >;
} ): Record< string, any >;
