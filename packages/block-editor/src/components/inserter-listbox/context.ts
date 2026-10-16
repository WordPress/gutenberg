import { createContext } from '@wordpress/element';

const InserterListboxContext = createContext< unknown >( undefined );
InserterListboxContext.displayName = 'InserterListboxContext';

export default InserterListboxContext;
