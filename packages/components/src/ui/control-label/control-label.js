/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useControlLabel } from './use-control-label';

const ControlLabel = createComponent( {
	as: 'label',
	useHook: useControlLabel,
	name: 'ControlLabel',
} );

export default ControlLabel;
