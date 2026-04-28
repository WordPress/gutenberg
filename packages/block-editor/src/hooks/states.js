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

export const STATE_LABELS = {
	':hover': __( 'Hover' ),
	':focus': __( 'Focus' ),
	':active': __( 'Active' ),
};

/**
 * Responsive state labels — available on all blocks without any block.json support declaration.
 * Keep in sync with RESPONSIVE_BREAKPOINTS in lib/class-wp-theme-json-gutenberg.php.
 */
export const RESPONSIVE_STATE_LABELS = {
	mobile: __( 'Mobile' ),
	tablet: __( 'Tablet' ),
};

/**
 * Renders a state selector in the block card header.
 * Always includes responsive states (Mobile, Tablet) for all blocks.
 * Also includes pseudo-states (:hover, :focus, :active) for blocks that
 * declare `states` support in block.json.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.name     Block name.
 * @param {string}   props.value    Currently selected state value.
 * @param {Function} props.onChange Callback when selection changes.
 * @return {Element} State control component.
 */
export function BlockStatesControl( { name, value, onChange } ) {
	const pseudoStates = getBlockSupport( name, STATES_SUPPORT_KEY ) ?? [];
	const pseudoStateOptions = pseudoStates
		.filter( ( state ) => STATE_LABELS[ state ] )
		.map( ( state ) => ( { value: state, label: STATE_LABELS[ state ] } ) );

	const responsiveStateOptions = Object.entries(
		RESPONSIVE_STATE_LABELS
	).map( ( [ key, label ] ) => ( { value: key, label } ) );

	const stateOptions = [ ...pseudoStateOptions, ...responsiveStateOptions ];

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
