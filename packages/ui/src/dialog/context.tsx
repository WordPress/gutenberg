import { createContext } from '@wordpress/element';

interface DialogContextValue {
	title?: string;
}

const DialogContext = createContext< DialogContextValue >( {} );

export { DialogContext };
