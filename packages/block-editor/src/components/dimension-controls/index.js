/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
/**
 * Internal dependencies
 */
import useDisplayBlockControls from '../use-display-block-controls';

const { Fill, Slot } = createSlotFill( 'DimensionControls' );

function DimensionControls( { children } ) {
	return useDisplayBlockControls() ? <Fill>{ children }</Fill> : null;
}

DimensionControls.Slot = Slot;

export default DimensionControls;
