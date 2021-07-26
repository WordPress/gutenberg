/**
 * Internal dependencies
 */
import { createComponent } from '../../ui/utils';
import { useItem } from './hook';

export default createComponent( {
	useHook: useItem,
	as: 'div',
	name: 'Item',
} );
