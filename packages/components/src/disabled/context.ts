import { createContext } from '@wordpress/element';

const Context = createContext< boolean >( false );
Context.displayName = 'DisabledContext';

export default Context;
