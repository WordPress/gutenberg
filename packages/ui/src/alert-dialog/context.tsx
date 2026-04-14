import { createContext } from '@wordpress/element';

type Phase = 'idle' | 'pending' | 'closing';

interface AlertDialogContextValue {
	phase: Phase;
	showSpinner: boolean;
	errorMessage?: string;
	confirm: () => Promise< void >;
}

const noop = async () => {};

const AlertDialogContext = createContext< AlertDialogContextValue >( {
	phase: 'idle',
	showSpinner: false,
	errorMessage: undefined,
	confirm: noop,
} );

export { AlertDialogContext };
export type { Phase };
