import { createSlotFill } from '@wordpress/components';
import type { ComponentProps } from 'react';
import {
	useBlockEditContext,
	mayDisplayControlsKey,
} from '../block-edit/context';

const { Fill, Slot } = createSlotFill( Symbol( 'InspectorControlsLastItem' ) );

const InspectorControlsLastItem = ( props: ComponentProps< typeof Fill > ) => {
	const context = useBlockEditContext();
	if ( ! context[ mayDisplayControlsKey ] ) {
		return null;
	}
	return <Fill { ...props } />;
};
InspectorControlsLastItem.Slot = function InspectorControlsLastItemSlot(
	props: ComponentProps< typeof Slot >
) {
	return <Slot { ...props } />;
};

export default InspectorControlsLastItem;
