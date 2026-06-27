/**
 * WordPress dependencies
 */
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
	'@tablet': __( 'Tablet' ),
	'@mobile': __( 'Mobile' ),
};

// Viewport states are selected globally via the editor's device preview
// (Responsive editing). 'default' maps to the Desktop device, the remaining
// options are derived from the shared responsive-state labels.
const DEVICE_STATE_OPTIONS = [
	{ value: 'default', label: __( 'Desktop' ) },
	...Object.entries( RESPONSIVE_STATE_LABELS ).map(
		( [ value, label ] ) => ( {
			value,
			label,
		} )
	),
];

// Keep in sync with WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS
// and packages/global-styles-engine/src/core/render.tsx.
export const VALID_BLOCK_PSEUDO_STATES = {
	'core/button': [ ':hover', ':focus', ':focus-visible', ':active' ],
	'core/navigation-link': [ ':hover', ':focus', ':focus-visible', ':active' ],
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

const DEFAULT_STATE_VALUE = 'default';

/**
 * Renders a pseudo-state selector in the block card header.
 *
 * Viewport states are selected globally via the editor's device preview
 * (Responsive editing), so only pseudo-states are exposed here.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.name     Block name.
 * @param {Object}   props.value    Currently selected style-state value.
 * @param {Function} props.onChange Callback when style-state selection changes.
 * @return {Element|null} State control component, or null if not applicable.
 */
export function BlockStatesControl( { name, value, onChange } ) {
	const pseudoStateOptions = getPseudoStateOptions( name );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	if ( ! pseudoStateOptions.length ) {
		return null;
	}

	return (
		<StateControl
			pseudoStates={ pseudoStateOptions }
			pseudoStateValue={ value?.pseudo ?? DEFAULT_STATE_VALUE }
			onChangePseudoState={ ( pseudo ) => onChange( { pseudo } ) }
			popoverProps={ dropdownMenuProps.popoverProps }
			showText={ false }
		/>
	);
}

/**
 * Renders badges for the active style states of a block.
 *
 * @param {Object}  props                     Component props.
 * @param {string}  props.name                Block name.
 * @param {Object}  props.value               Currently selected style-state value.
 * @param {boolean} props.isResponsiveEditing Whether Responsive editing is enabled.
 * @return {Element|null} Badges component, or null if there is nothing to show.
 */
export function BlockStateBadges( { name, value, isResponsiveEditing } ) {
	const pseudoStateOptions = getPseudoStateOptions( name );

	if ( ! pseudoStateOptions.length && ! isResponsiveEditing ) {
		return null;
	}

	return (
		<StateControlBadges
			viewportStates={ isResponsiveEditing ? DEVICE_STATE_OPTIONS : [] }
			pseudoStates={ pseudoStateOptions }
			viewportValue={ value?.viewport ?? DEFAULT_STATE_VALUE }
			pseudoStateValue={ value?.pseudo ?? DEFAULT_STATE_VALUE }
		/>
	);
}
