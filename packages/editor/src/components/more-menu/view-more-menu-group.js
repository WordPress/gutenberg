/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { Platform } from '@wordpress/element';

const { Fill: ViewMoreMenuGroup, Slot } = createSlotFill(
	Platform.OS === 'web' ? Symbol( 'ViewMoreMenuGroup' ) : 'ViewMoreMenuGroup'
);

ViewMoreMenuGroup.Slot = ( { fillProps } ) => <Slot fillProps={ fillProps } />;

export default ViewMoreMenuGroup;
