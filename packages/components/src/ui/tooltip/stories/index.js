/**
 * Internal dependencies
 */
import { Text } from '../../../text';
import { Tooltip } from '../index';

export default {
	component: Tooltip,
	title: 'Components (Experimental)/Tooltip',
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
