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
import { ROOT_LEVEL } from './constants';

export const NavigationContext = createContext( {
	activeItem: undefined,
	activeLevel: ROOT_LEVEL,
	setActiveItem: noop,
	setActiveLevel: noop,
} );
export const useNavigationContext = () => useContext( NavigationContext );
