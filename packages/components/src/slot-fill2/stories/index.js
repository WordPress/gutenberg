/**
 * Internal dependencies
 */
import { Slot, Fill, Provider } from '../';

export default { title: 'Components|SlotFill', component: Slot };

export const _default = () => {
	return (
		<Provider>
			<div className="slot">
				<Slot name="a" />
			</div>
			<div className="fill">
				<Fill name="a">
					<div className="fill-children">fill</div>
				</Fill>
			</div>
		</Provider>
	);
};
