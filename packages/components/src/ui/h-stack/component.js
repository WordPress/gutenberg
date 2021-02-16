/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useHStack } from './hook';

export default createComponent( {
	as: 'div',
	useHook: useHStack,
	name: 'HStack',
} );
