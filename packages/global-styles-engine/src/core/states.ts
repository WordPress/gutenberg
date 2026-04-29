/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * State group definition with order and available states.
 */
export interface StateGroupDefinition {
	order: number;
	states: Record< string, { label: string } >;
}

/**
 * Defines the available state groups and their valid states.
 *
 * Each group has:
 * - `order`: Nesting order (lower = outer level). When states from multiple
 *   groups are combined, lower-order groups wrap higher-order ones.
 * - `states`: A map of valid state keys to metadata (label for UI display).
 *   State keys use a prefix character (':' for CSS pseudo-selectors,
 *   '@' for class-based states) to distinguish them from style property keys.
 *
 * Keep in sync with WP_Theme_JSON_Gutenberg::STATE_GROUPS.
 */
export const STATE_GROUPS: Record< string, StateGroupDefinition > = {
	currentItem: {
		order: 10,
		states: {
			'@current': { label: __( 'Current' ) },
		},
	},
	pseudo: {
		order: 20,
		states: {
			':hover': { label: __( 'Hover' ) },
			':focus': { label: __( 'Focus' ) },
			':focus-visible': { label: __( 'Focus-visible' ) },
			':active': { label: __( 'Active' ) },
			':link': { label: __( 'Link' ) },
			':any-link': { label: __( 'Any Link' ) },
			':visited': { label: __( 'Visited' ) },
		},
	},
};

/**
 * Defines which state groups (and which states within those groups) each block supports.
 *
 * Keep in sync with WP_Theme_JSON_Gutenberg::BLOCK_STATE_SUPPORT.
 */
export const BLOCK_STATE_SUPPORT: Record<
	string,
	Record< string, string[] >
> = {
	'core/button': {
		pseudo: [ ':hover', ':focus', ':focus-visible', ':active' ],
	},
	'core/navigation-link': {
		currentItem: [ '@current' ],
		pseudo: [ ':hover', ':focus', ':focus-visible', ':active' ],
	},
};

/**
 * Defines which state groups each element supports.
 *
 * Keep in sync with WP_Theme_JSON_Gutenberg::ELEMENT_STATE_SUPPORT.
 */
export const ELEMENT_STATE_SUPPORT: Record<
	string,
	Record< string, string[] >
> = {
	link: {
		pseudo: [
			':link',
			':any-link',
			':visited',
			':hover',
			':focus',
			':focus-visible',
			':active',
		],
	},
	button: {
		pseudo: [
			':link',
			':any-link',
			':visited',
			':hover',
			':focus',
			':focus-visible',
			':active',
		],
	},
};

/**
 * Get the flat list of all state keys a block supports, across all groups.
 *
 * @param blockName The block name (e.g. 'core/button').
 * @return Array of state keys (e.g. [':hover', ':focus', '@current']).
 */
export function getBlockStates( blockName: string ): string[] {
	const support = BLOCK_STATE_SUPPORT[ blockName ];
	if ( ! support ) {
		return [];
	}
	return Object.values( support ).flat();
}

/**
 * Get the flat list of all state keys an element supports, across all groups.
 *
 * @param element The element name (e.g. 'link', 'button').
 * @return Array of state keys.
 */
export function getElementStates( element: string ): string[] {
	const support = ELEMENT_STATE_SUPPORT[ element ];
	if ( ! support ) {
		return [];
	}
	return Object.values( support ).flat();
}
