/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'InspectorControls' );

function InspectorControls() {
	const { isSelected } = useBlockEditContext();
	return isSelected ? <Fill /> : null;
}

InspectorControls.Slot = Slot;

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/inspector-controls/README.md
 */
export default InspectorControls;
