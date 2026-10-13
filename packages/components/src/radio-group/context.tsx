import type * as Ariakit from '@ariakit/react';
import { createContext } from '@wordpress/element';

export const RadioGroupContext = createContext< {
	store?: Ariakit.RadioStore;
	disabled?: boolean;
} >( {
	store: undefined,
	disabled: undefined,
} );
RadioGroupContext.displayName = 'RadioGroupContext';
