/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { useBlockEditContext } from '../block-edit/context';

const { createPrivateSlotFill } = unlock( componentsPrivateApis );
const { Fill, Slot } = createPrivateSlotFill( 'BlockInformation' );

const BlockInfo = ( props ) => {
	const { mayDisplayControls } = useBlockEditContext();
	if ( ! mayDisplayControls ) {
		return null;
	}
	return <Fill { ...props } />;
};
BlockInfo.Slot = ( props ) => <Slot { ...props } />;

export default BlockInfo;
