/**
 * Internal dependencies
 */
import Slot from './slot';
import Fill from './fill';
import Provider from './provider';

export { Slot };
export { Fill };
export { Provider };

export function createSlotFill( name ) {
	const Component = ( { children, ...props } ) => (
		<Fill name={ name } { ...props }>
			{ children }
		</Fill>
	);
	Component.displayName = name;

	Component.Slot = ( { children, ...props } ) => (
		<Slot name={ name } { ...props }>
			{ children }
		</Slot>
	);

	return Component;
}
