/**
 * Internal dependencies
 */
import { View } from '../../view';
import { Scrollable } from '../';

export default {
	component: Scrollable,
	title: 'Components (Experimental)/Scrollable',
};

export const _default = () => {
	return (
		<Scrollable style={ { height: 400, width: 300 } }>
			<View style={ { backgroundColor: '#eee', height: 1000 } } />
		</Scrollable>
	);
};
