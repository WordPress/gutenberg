import { createContext } from '@wordpress/element';

/**
 * When `true`, commands and command loaders registered inside are taken out
 * of the command palette, as if they were `disabled`. For example, an admin
 * page kept mounted while another page is showing provides `true`, so the
 * palette only offers the commands of the page in view.
 */
export const CommandsDisabledContext = createContext( false );
CommandsDisabledContext.displayName = 'CommandsDisabledContext';
