/**
 * External dependencies
 */
import { createContext } from 'react';

interface DialogContextValue {
	title?: string;
}

const DialogContext = createContext< DialogContextValue >( {} );

export { DialogContext };
