/**
 * WordPress dependencies
 */
import { __EXPERIMENTAL_ELEMENTS as ELEMENTS } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { scopeSelector } from '../components/global-styles/utils';

export const STATES_ELEMENT_SUPPORT_KEY = '__experimentalStatesElement';

/**
 * Builds the scoped CSS selector for a block state (e.g. :hover, :focus).
 *
 * When the block declares `__experimentalStatesElement` pointing to a known
 * ELEMENTS key (e.g. "button"), the pseudo-class is appended to each
 * comma-separated element selector part and the result is scoped under
 * `baseSelector`. Otherwise falls back to appending the state directly to
 * `baseSelector` (i.e. the block wrapper).
 *
 * @param {string}      baseSelector  The block-instance scoping class selector.
 * @param {string|null} statesElement Value of `__experimentalStatesElement` support, or null.
 * @param {string}      state         The pseudo-class string, e.g. ":hover".
 * @return {string} The fully-scoped CSS selector for this state.
 */
export function buildStateSelector( baseSelector, statesElement, state ) {
	if ( statesElement && ELEMENTS[ statesElement ] ) {
		const elementParts = ELEMENTS[ statesElement ]
			.split( ',' )
			.map( ( part ) => part.trim() + state )
			.join( ', ' );
		return scopeSelector( baseSelector, elementParts );
	}
	return `${ baseSelector }${ state }`;
}
