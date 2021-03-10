/**
 * Internal dependencies
 */
import { Text } from '../../index';
import { Tooltip } from '../index';

export default {
	component: Tooltip,
	title: 'G2 Components (Experimental)/Tooltip',
};

export const _default = () => {
	return (
		<Tooltip
			content="Tooltip"
			visible
			gutter={ 10 }
			shortcut={ {
				display: 'meta + 1',
				ariaLabel: 'shortcut-aria-label',
			} }
		>
			<Text>Hello</Text>
		</Tooltip>
	);
};
