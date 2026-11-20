import { createContext } from '@wordpress/element';

export type SaveShortcutHandlerRef = {
	current: ( () => boolean ) | null;
};

export const SaveShortcutContext =
	createContext< SaveShortcutHandlerRef | null >( null );
