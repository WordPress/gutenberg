/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockClientId } from '../block-edit';
import { store as blockEditorStore } from '../../store';

const name = 'InspectorAdvancedControls';
const { Fill, Slot } = createSlotFill( name );

function InspectorAdvancedControls( { children } ) {
	const clientId = useBlockClientId();
	const isSelected = useSelect(
		( select ) => select( blockEditorStore ).isBlockSelected( clientId ),
		[ clientId ]
	);
	return isSelected ? <Fill>{ children }</Fill> : null;
}

InspectorAdvancedControls.slotName = name;
InspectorAdvancedControls.Slot = Slot;

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-advanced-controls/README.md
 */
export default InspectorAdvancedControls;
