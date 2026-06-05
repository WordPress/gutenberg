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

// Viewport states are selected globally via the editor's device preview
// (Responsive editing). 'default' maps to the Desktop device.
const DEVICE_STATE_OPTIONS = [
	{ value: 'default', label: __( 'Desktop' ) },
	{ value: 'tablet', label: __( 'Tablet' ) },
	{ value: 'mobile', label: __( 'Mobile' ) },
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

function hasStyleAttribute( name ) {
	return !! getBlockType( name )?.attributes?.style;
}

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
 * When Responsive editing is enabled, a device badge (Desktop/Tablet/Mobile)
 * is shown for blocks that support viewport styles, alongside any selected
 * pseudo-state badge.
 *
 * @param {Object}  props                     Component props.
 * @param {string}  props.name                Block name.
 * @param {Object}  props.value               Currently selected style-state value.
 * @param {boolean} props.isResponsiveEditing Whether Responsive editing is enabled.
 * @return {Element|null} Badges component, or null if there is nothing to show.
 */
export function BlockStateBadges( { name, value, isResponsiveEditing } ) {
	const pseudoStateOptions = getPseudoStateOptions( name );
	const showDeviceBadge = isResponsiveEditing && hasStyleAttribute( name );

	if ( ! pseudoStateOptions.length && ! showDeviceBadge ) {
		return null;
	}

	return (
		<StateControlBadges
			viewportStates={ showDeviceBadge ? DEVICE_STATE_OPTIONS : [] }
			viewportValue={ value?.viewport ?? DEFAULT_STATE_VALUE }
			pseudoStates={ pseudoStateOptions }
			pseudoStateValue={ value?.pseudo ?? DEFAULT_STATE_VALUE }
		/>
	);
}
