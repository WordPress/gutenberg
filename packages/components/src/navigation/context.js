/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DEFAULT_LEVEL } from './utils';

export const NavigationContext = createContext( {
	activeItem: undefined,
	activeLevel: DEFAULT_LEVEL,
	setActiveItem: noop,
	setActiveLevel: noop,
} );
export const useNavigationContext = () => useContext( NavigationContext );
