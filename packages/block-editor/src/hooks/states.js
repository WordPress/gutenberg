/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import StateControl from '../components/global-styles/state-control';
import StateControlBadges from '../components/global-styles/state-control-badges';
import { useToolsPanelDropdownMenuProps } from '../components/global-styles/utils';

export const PSEUDO_STATE_LABELS = {
	':hover': __( 'Hover' ),
	':focus': __( 'Focus' ),
	':focus-visible': __( 'Focus-visible' ),
	':active': __( 'Active' ),
};

export const RESPONSIVE_STATE_LABELS = {
	tablet: __( 'Tablet' ),
	mobile: __( 'Mobile' ),
};

export const CUSTOM_STATE_LABELS = {
	'@current': __( 'Current' ),
};

// Keep in sync with WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS
// and packages/global-styles-engine/src/core/render.tsx.
export const VALID_BLOCK_PSEUDO_STATES = {
	'core/button': [ ':hover', ':focus', ':focus-visible', ':active' ],
	'core/navigation-link': [ ':hover', ':focus', ':focus-visible', ':active' ],
};

// Keep in sync with WP_Theme_JSON_Gutenberg::VALID_BLOCK_CUSTOM_STATES.
// Custom states are class-based (e.g. `.current-menu-item`) rather than CSS
// pseudo-selectors; the actual CSS selector is declared on the block type via
// `selectors.states` in block.json.
export const VALID_BLOCK_CUSTOM_STATES = {
	'core/navigation-link': [ '@current' ],
};

function getPseudoStateOptions( name ) {
	const validStates = VALID_BLOCK_PSEUDO_STATES[ name ] ?? [];

	return validStates
		.filter( ( state ) => PSEUDO_STATE_LABELS[ state ] )
		.map( ( state ) => ( {
			value: state,
			label: PSEUDO_STATE_LABELS[ state ],
		} ) );
}

function getCustomStateOptions( name ) {
	const validStates = VALID_BLOCK_CUSTOM_STATES[ name ] ?? [];
	const blockSelectors = getBlockType( name )?.selectors?.states ?? {};

	return validStates
		.filter(
			( state ) => CUSTOM_STATE_LABELS[ state ] && blockSelectors[ state ]
		)
		.map( ( state ) => ( {
			value: state,
			label: CUSTOM_STATE_LABELS[ state ],
		} ) );
}

const DEFAULT_STATE_VALUE = 'default';

function getViewportStateOptions( name ) {
	if ( ! getBlockType( name )?.attributes?.style ) {
		return [];
	}

	return Object.entries( RESPONSIVE_STATE_LABELS ).map(
		( [ value, label ] ) => ( {
			value,
			label,
		} )
	);
}

/**
 * Renders a style-state selector in the block card header.
 * Viewport states are shown for blocks with a style attribute, while
 * pseudo-states are shown for blocks with configured pseudo-state support.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.name     Block name.
 * @param {Object}   props.value    Currently selected style-state value.
 * @param {Function} props.onChange Callback when style-state selection changes.
 * @return {Element|null} State control component, or null if not applicable.
 */
export function BlockStatesControl( { name, value, onChange } ) {
	const viewportStateOptions = getViewportStateOptions( name );
	const customStateOptions = getCustomStateOptions( name );
	const pseudoStateOptions = getPseudoStateOptions( name );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	if (
		! viewportStateOptions.length &&
		! customStateOptions.length &&
		! pseudoStateOptions.length
	) {
		return null;
	}

	return (
		<StateControl
			viewportStates={ viewportStateOptions }
			customStates={ customStateOptions }
			pseudoStates={ pseudoStateOptions }
			viewportValue={ value?.viewport ?? DEFAULT_STATE_VALUE }
			customStateValue={ value?.custom ?? DEFAULT_STATE_VALUE }
			pseudoStateValue={ value?.pseudo ?? DEFAULT_STATE_VALUE }
			onChangeViewport={ ( viewport ) => onChange( { viewport } ) }
			onChangeCustomState={ ( custom ) => onChange( { custom } ) }
			onChangePseudoState={ ( pseudo ) => onChange( { pseudo } ) }
			popoverProps={ dropdownMenuProps.popoverProps }
			showText={ false }
		/>
	);
}

export function BlockStateBadges( { name, value } ) {
	const viewportStateOptions = getViewportStateOptions( name );
	const customStateOptions = getCustomStateOptions( name );
	const pseudoStateOptions = getPseudoStateOptions( name );

	if (
		! viewportStateOptions.length &&
		! customStateOptions.length &&
		! pseudoStateOptions.length
	) {
		return null;
	}

	return (
		<StateControlBadges
			viewportStates={ viewportStateOptions }
			customStates={ customStateOptions }
			pseudoStates={ pseudoStateOptions }
			viewportValue={ value?.viewport ?? DEFAULT_STATE_VALUE }
			customStateValue={ value?.custom ?? DEFAULT_STATE_VALUE }
			pseudoStateValue={ value?.pseudo ?? DEFAULT_STATE_VALUE }
		/>
	);
}
