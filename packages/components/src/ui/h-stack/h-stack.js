/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useHStack } from './use-h-stack';

export default createComponent( {
	as: 'div',
	useHook: useHStack,
	name: 'HStack',
} );
