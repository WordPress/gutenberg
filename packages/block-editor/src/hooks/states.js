/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import StateControl from '../components/global-styles/state-control';
import { BlockCardControlsFill } from '../components/block-card';

export const STATES_SUPPORT_KEY = 'states';

/** Labels for CSS pseudo-selector states. */
export const STATE_LABELS = {
	':hover': __( 'Hover' ),
	':focus': __( 'Focus' ),
	':active': __( 'Active' ),
};

/** Labels for custom (`@`-prefixed) states. */
export const CUSTOM_STATE_LABELS = {
	'@current': __( 'Current' ),
};

/**
 * Returns true if the state value is a CSS pseudo-selector (starts with `:`).
 *
 * @param {string} state State value, e.g. ':hover' or '@current'.
 * @return {boolean} Whether the state is a pseudo-selector.
 */
export function isPseudoState( state ) {
	return state.startsWith( ':' );
}

/**
 * Returns true if the state value is a custom class-based state (starts with `@`).
 *
 * @param {string} state State value, e.g. '@current'.
 * @return {boolean} Whether the state is a custom state.
 */
export function isCustomState( state ) {
	return state.startsWith( '@' );
}

/**
 * Renders a state selector (hover, focus, active, current…) in the block card
 * header. Only shown for blocks that declare `states` support.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.name     Block name.
 * @param {string[]} props.value    Currently selected state values.
 * @param {Function} props.onChange Callback when selection changes.
 * @return {Element|null} State control component, or null if not applicable.
 */
export function BlockStatesControl( { name, value, onChange } ) {
	const validStates = getBlockSupport( name, STATES_SUPPORT_KEY ) ?? [];

	const allLabels = { ...STATE_LABELS, ...CUSTOM_STATE_LABELS };
	const stateOptions = validStates
		.filter( ( state ) => allLabels[ state ] )
		.map( ( state ) => ( { value: state, label: allLabels[ state ] } ) );

	if ( ! stateOptions.length ) {
		return null;
	}

	return (
		<BlockCardControlsFill>
			<StateControl
				states={ stateOptions }
				value={ value }
				onChange={ onChange }
				showText={ false }
			/>
		</BlockCardControlsFill>
	);
}
