/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useSurface } from './use-surface';

export default createComponent( {
	as: 'div',
	useHook: useSurface,
	name: 'Surface',
} );
