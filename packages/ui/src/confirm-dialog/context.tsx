import { createContext } from '@wordpress/element';
import type { RootProps } from './types';

type Intent = NonNullable< RootProps[ 'intent' ] >;

interface ConfirmDialogContextValue {
	intent: Intent;
}

const ConfirmDialogContext = createContext< ConfirmDialogContextValue >( {
	intent: 'default',
} );

export { ConfirmDialogContext };
