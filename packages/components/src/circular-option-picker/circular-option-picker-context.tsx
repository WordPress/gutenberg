import { createContext } from '@wordpress/element';
import type { CircularOptionPickerContextProps } from './types';

export const CircularOptionPickerContext =
	createContext< CircularOptionPickerContextProps >( {} );
CircularOptionPickerContext.displayName = 'CircularOptionPickerContext';
