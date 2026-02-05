/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	useBlockEditContext,
	mayDisplayControlsKey,
} from '../block-edit/context';

const { Fill, Slot } = createSlotFill( Symbol( 'InspectorControlsLastItem' ) );

const InspectorControlsLastItem = ( props ) => {
	const context = useBlockEditContext();
	if ( ! context[ mayDisplayControlsKey ] ) {
		return null;
	}
	return <Fill { ...props } />;
};
InspectorControlsLastItem.Slot = function InspectorControlsLastItemSlot(
	props
) {
	return <Slot { ...props } />;
};

export default InspectorControlsLastItem;
