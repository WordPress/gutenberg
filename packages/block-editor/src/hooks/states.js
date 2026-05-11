/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import StateControl from '../components/global-styles/state-control';
import { BlockCardControlsFill } from '../components/block-card';

export const PSEUDO_STATE_LABELS = {
	':hover': __( 'Hover' ),
	':focus': __( 'Focus' ),
	':focus-visible': __( 'Focus-visible' ),
	':active': __( 'Active' ),
};

// Keep in sync with WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS
// and packages/global-styles-engine/src/core/render.tsx.
export const VALID_BLOCK_PSEUDO_STATES = {
	'core/button': [ ':hover', ':focus', ':focus-visible', ':active' ],
	'core/navigation-link': [ ':hover', ':focus', ':focus-visible', ':active' ],
};

/**
 * Renders a pseudo-state selector in the block card header.
 * Only shown for blocks with configured pseudo-state support.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.name     Block name.
 * @param {string}   props.value    Currently selected pseudo-state value.
 * @param {Function} props.onChange Callback when pseudo-state selection changes.
 * @return {Element|null} State control component, or null if not applicable.
 */
export function BlockStatesControl( { name, value, onChange } ) {
	const validStates = VALID_BLOCK_PSEUDO_STATES[ name ] ?? [];
	const stateOptions = validStates
		.filter( ( state ) => PSEUDO_STATE_LABELS[ state ] )
		.map( ( state ) => ( {
			value: state,
			label: PSEUDO_STATE_LABELS[ state ],
		} ) );

	if ( ! stateOptions.length ) {
		return null;
	}

	return (
		<BlockCardControlsFill>
			<StateControl
				pseudoStates={ stateOptions }
				pseudoStateValue={ value }
				onChangePseudoState={ onChange }
				showText={ false }
			/>
		</BlockCardControlsFill>
	);
}
