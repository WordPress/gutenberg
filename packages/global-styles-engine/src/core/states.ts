/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * State group definition with order, label, and available states.
 */
export interface StateGroupDefinition {
	order: number;
	label: string;
	states: Record< string, { label: string } >;
}

/**
 * A state group resolved for a specific block or element, with only
 * the states that block/element supports.
 */
export interface ResolvedStateGroup {
	name: string;
	label: string;
	order: number;
	states: Array< { value: string; label: string } >;
}

/**
 * Defines the available state groups and their valid states.
 *
 * Each group has:
 * - `order`: Nesting order (lower = outer level). When states from multiple
 *   groups are combined, lower-order groups wrap higher-order ones.
 * - `label`: Display label for the group in the UI.
 * - `states`: A map of valid state keys to metadata (label for UI display).
 *   State keys use a prefix character (':' for CSS pseudo-selectors,
 *   '@' for class-based states) to distinguish them from style property keys.
 *
 * Keep in sync with WP_Theme_JSON_Gutenberg::STATE_GROUPS.
 */
export const STATE_GROUPS: Record< string, StateGroupDefinition > = {
	currentItem: {
		order: 10,
		label: __( 'Current Item' ),
		states: {
			'@current': { label: __( 'Current' ) },
		},
	},
	pseudo: {
		order: 20,
		label: __( 'State' ),
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

/**
 * Get the valid state groups for a block or element, sorted by order.
 *
 * Each returned group contains only the states that the given block or element
 * supports, with labels resolved from STATE_GROUPS. Groups are sorted by
 * ascending order (lower order = outer nesting level).
 *
 * @param name The block name (e.g. 'core/button') or element name (e.g. 'link').
 * @return Array of resolved state groups, sorted by order.
 */
export function getValidStateGroups( name: string ): ResolvedStateGroup[] {
	const support =
		BLOCK_STATE_SUPPORT[ name ] ?? ELEMENT_STATE_SUPPORT[ name ];
	if ( ! support ) {
		return [];
	}

	const groups: ResolvedStateGroup[] = [];

	for ( const [ groupName, stateKeys ] of Object.entries( support ) ) {
		const groupDef = STATE_GROUPS[ groupName ];
		if ( ! groupDef ) {
			continue;
		}

		const states = stateKeys
			.filter( ( key ) => key in groupDef.states )
			.map( ( key ) => ( {
				value: key,
				label: groupDef.states[ key ].label,
			} ) );

		if ( states.length > 0 ) {
			groups.push( {
				name: groupName,
				label: groupDef.label,
				order: groupDef.order,
				states,
			} );
		}
	}

	groups.sort( ( a, b ) => a.order - b.order );
	return groups;
}
