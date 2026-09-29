import { createContext } from '@wordpress/element';

export const slotNameContext = createContext< string | undefined >( undefined );
slotNameContext.displayName = '__unstableSlotNameContext';
