import { createContext } from 'react';

interface ConfirmDialogContextValue {
	intent: 'default' | 'irreversible';
}

const ConfirmDialogContext = createContext< ConfirmDialogContextValue >( {
	intent: 'default',
} );

export { ConfirmDialogContext };
