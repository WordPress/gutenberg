/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DropdownMenuContext as DropdownMenuContextType } from './types';

export const DropdownMenuContext = createContext<
	DropdownMenuContextType | undefined
>( undefined );
