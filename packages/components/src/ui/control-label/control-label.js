/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useControlLabel } from './use-control-label';

export default createComponent( {
	as: 'label',
	useHook: useControlLabel,
	name: 'ControlLabel',
} );
