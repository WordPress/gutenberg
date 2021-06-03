/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useItem } from './use-item';

export default createComponent( {
	useHook: useItem,
	as: 'div',
	name: 'Item',
} );
