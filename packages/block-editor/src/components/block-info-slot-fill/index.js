/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { createPrivateSlotFill } = unlock( componentsPrivateApis );
const { Fill, Slot } = createPrivateSlotFill( 'BlockInformation' );

const BlockInfo = ( props ) => <Fill { ...props } />;
BlockInfo.Slot = ( props ) => <Slot { ...props } />;

export default BlockInfo;
