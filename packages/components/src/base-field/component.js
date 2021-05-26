/**
 * Internal dependencies
 */
import { createComponent } from '../ui/utils';
import { useBaseField } from './hook';

/**
 * `BaseField` is a primitive component used to create form element components (e.g. `TextInput`).
 */
export default createComponent( {
	as: 'div',
	useHook: useBaseField,
	name: 'BaseField',
} );
