/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import useDisplayBlockControls from '../use-display-block-controls';

const { createPrivateSlotFill } = unlock( componentsPrivateApis );
const { Fill, Slot } = createPrivateSlotFill( 'BlockInformation' );

const BlockInfo = ( props ) => {
	const isDisplayed = useDisplayBlockControls();
	if ( ! isDisplayed ) {
		return null;
	}
	return <Fill { ...props } />;
};
BlockInfo.Slot = ( props ) => <Slot { ...props } />;

export default BlockInfo;
