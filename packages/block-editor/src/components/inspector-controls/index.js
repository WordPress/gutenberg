/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useDisplayBlockControls from '../use-display-block-controls';

const { Fill, Slot } = createSlotFill( 'InspectorControls' );

function InspectorControls( { children } ) {
	return useDisplayBlockControls() ? <Fill>{ children }</Fill> : null;
}

InspectorControls.Slot = Slot;

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-controls/README.md
 */
export default InspectorControls;
