import { createContext } from '@wordpress/element';
import type { RootProps } from './types';

type Intent = NonNullable< RootProps[ 'intent' ] >;

interface AlertDialogContextValue {
	intent: Intent;
}

const AlertDialogContext = createContext< AlertDialogContextValue >( {
	intent: 'default',
} );

export { AlertDialogContext };
