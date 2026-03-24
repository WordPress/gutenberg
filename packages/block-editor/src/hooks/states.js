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

export const STATES_SUPPORT_KEY = '__experimentalStates';

export const STATE_LABELS = {
	':hover': __( 'Hover' ),
	':focus': __( 'Focus' ),
	':active': __( 'Active' ),
};

/**
 * Renders a state selector (hover, focus, active) in the block card header.
 * Only shown for blocks that declare `__experimentalStates` support.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.name     Block name.
 * @param {string}   props.value    Currently selected state value.
 * @param {Function} props.onChange Callback when selection changes.
 * @return {Element|null} State control component, or null if not applicable.
 */
export function BlockStatesControl( { name, value, onChange } ) {
	const validStates = getBlockSupport( name, STATES_SUPPORT_KEY ) ?? [];
	const stateOptions = validStates
		.filter( ( state ) => STATE_LABELS[ state ] )
		.map( ( state ) => ( { value: state, label: STATE_LABELS[ state ] } ) );

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
