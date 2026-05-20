/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

export const keyboardShortcutContext = createContext();
keyboardShortcutContext.displayName = 'keyboardShortcutContext';

export const inputEventContext = createContext();
inputEventContext.displayName = 'inputEventContext';
