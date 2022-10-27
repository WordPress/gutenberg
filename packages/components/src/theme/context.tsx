/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ThemeProps as ThemePropsType } from './types';

const initialContextValue: ThemePropsType = {};
export const ThemeContext = createContext( initialContextValue );
