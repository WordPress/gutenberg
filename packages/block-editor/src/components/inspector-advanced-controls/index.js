/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit/context';

const name = 'InspectorAdvancedControls';
const { Fill, Slot } = createSlotFill( name );

function InspectorAdvancedControls( { children } ) {
	const { isSelected } = useBlockEditContext();
	return isSelected ? <Fill>{ children }</Fill> : null;
}

InspectorAdvancedControls.slotName = name;
InspectorAdvancedControls.Slot = Slot;

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/inspector-controls-advanced/README.md
 */
export default InspectorAdvancedControls;
