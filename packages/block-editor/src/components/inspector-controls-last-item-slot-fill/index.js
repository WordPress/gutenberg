/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import {
	useBlockEditContext,
	mayDisplayControlsKey,
} from '../block-edit/context';

const { createPrivateSlotFill } = unlock( componentsPrivateApis );
const { Fill, Slot } = createPrivateSlotFill( 'InspectorControlsLastItem' );

const InspectorControlsLastItem = ( props ) => {
	const context = useBlockEditContext();
	if ( ! context[ mayDisplayControlsKey ] ) {
		return null;
	}
	return <Fill { ...props } />;
};
InspectorControlsLastItem.Slot = ( props ) => <Slot { ...props } />;

export default InspectorControlsLastItem;
