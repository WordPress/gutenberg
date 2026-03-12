/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';

export const WindowContext = createContext< Window >( window );

export const privateApis = {};
lock( privateApis, { WindowContext } );
