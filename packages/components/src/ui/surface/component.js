/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useSurface } from './hook';

export default createComponent( {
	as: 'div',
	useHook: useSurface,
	name: 'Surface',
} );
