/**
 * Internal dependencies
 */
import Slot from './slot';
import Fill from './fill';
import Provider, { Consumer } from './context';

export { Slot };
export { Fill };
export { Provider, Consumer };

export function createSlotFill( name ) {
	const FillComponent = ( props ) => <Fill name={ name } { ...props } />;
	FillComponent.displayName = name + 'Fill';

	const SlotComponent = ( props ) => <Slot name={ name } { ...props } />;
	SlotComponent.displayName = name + 'Slot';

	return {
		Fill: FillComponent,
		Slot: SlotComponent,
	};
}
