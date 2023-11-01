/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { CircularOptionPickerContextProps } from './types';

export const CircularOptionPickerContext =
	createContext< CircularOptionPickerContextProps >( {} );
