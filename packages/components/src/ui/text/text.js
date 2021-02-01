/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import useText from './use-text';

export default createComponent( {
	as: 'span',
	useHook: useText,
	name: 'Text',
} );
