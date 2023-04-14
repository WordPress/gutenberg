/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

export const createPrivateSlotFill = ( name ) => {
	const privateKey = Symbol( name );
	const privateSlotFill = createSlotFill( privateKey );

	return { privateKey, ...privateSlotFill };
};

const { Fill, Slot } = createPrivateSlotFill( 'BlockInformation' );
const BlockInfo = ( props ) => <Fill { ...props } />;
BlockInfo.Slot = ( props ) => <Slot { ...props } />;

export default BlockInfo;
