/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

export const RadioGroupContext = createContext< {
	store?: Ariakit.RadioStore;
	disabled?: boolean;
} >( {
	store: undefined,
	disabled: undefined,
} );
