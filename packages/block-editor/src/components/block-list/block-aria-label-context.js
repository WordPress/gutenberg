/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Private context to override the `aria-label` of a block's wrapper element,
 * including blocks that label their own wrapper (e.g. Paragraph). Used by the
 * post revisions canvas to announce a block's diff status to screen readers.
 *
 * @type {React.Context<string|undefined>}
 */
export const BlockAriaLabelOverrideContext = createContext( undefined );
