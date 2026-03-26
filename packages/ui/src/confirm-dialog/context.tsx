import { createContext } from '@wordpress/element';

interface ConfirmDialogContextValue {
	intent: 'default' | 'irreversible';
	title: string;
}

const ConfirmDialogContext = createContext< ConfirmDialogContextValue >( {
	intent: 'default',
	title: '',
} );

export { ConfirmDialogContext };
