/**
 * Internal dependencies
 */
import { View } from '../../../index';
import { Scrollable } from '../index';

export default {
	component: Scrollable,
	title: 'G2 Components (Experimental)/Scrollable',
};

export const _default = () => {
	return (
		<Scrollable style={ { height: 400, width: 300 } }>
			<View style={ { backgroundColor: '#eee', height: 1000 } } />
		</Scrollable>
	);
};
