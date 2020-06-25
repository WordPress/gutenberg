/**
 * Internal dependencies
 */
import ContextPopover from '../';
import { Provider } from '../../slot-fill';
import Popover from '../../popover';

export default {
	title: 'Components/ContextPopover',
	component: ContextPopover,
};

export const _default = () => {
	return (
		<Provider>
			<ContextPopover />
			<Popover.Slot />
		</Provider>
	);
};
