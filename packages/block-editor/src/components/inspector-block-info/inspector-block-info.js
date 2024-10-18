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

const { Fill, Slot } = createSlotFill(
	'InspectorBlockInfoFill'
);

const InspectorBlockInfoFill = ( props ) => {
	const context = useBlockEditContext();
	if ( ! context[ mayDisplayControlsKey ] ) {
		return null;
	}
	return <Fill { ...props } />;
};
InspectorBlockInfoFill.Slot = ( props ) => <Slot { ...props } />;

export default InspectorBlockInfoFill;
