/**
 * Fork of:
 * https://github.com/styled-components/stylis-plugin-rtl
 */
/**
 * External dependencies
 */
import rtlcss from 'rtlcss';

/**
 * Internal dependencies
 */
import { STYLIS_CONTEXTS } from './utils';

let isRtl = false;
if ( typeof window !== 'undefined' ) {
	isRtl = window?.document?.documentElement?.dir === 'rtl';
}

// We need to apply cssjanus as early as possible to capture the noflip directives if used
// (they are not present at the PROPERTY, SELECTOR_BLOCK, or POST_PROCESS steps)
export const STYLIS_PROPERTY_CONTEXT = STYLIS_CONTEXTS.PREPARATION;

/**
 * Custom stylis plugin that flips applicable styles from LTR to RTL based
 * on the <html dir="" /> property. On render, if dir="rtl", the styles will render
 * as RTL flipped.
 *
 * It's currently not possible to dynamically flip between LTR and RTL styles.
 * The LTR/RTL detection happens only once on render.
 *
 * This is something that can be improved in future.
 *
 * @param {number} context
 * @param {string} content
 * @return {string | undefined} The RTL processed CSS.
 */
function stylisRTLPlugin( context, content ) {
	if ( context === STYLIS_PROPERTY_CONTEXT ) {
		// pass four undefineds to let TS know which overload we're using
		return isRtl
			? rtlcss.process( content, undefined, undefined, undefined )
			: undefined;
	}
	return undefined;
}

export default stylisRTLPlugin;
