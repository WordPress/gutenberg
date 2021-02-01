/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import useTruncate from './use-truncate';

export default createComponent( {
	as: 'span',
	useHook: useTruncate,
	name: 'Truncate',
} );
