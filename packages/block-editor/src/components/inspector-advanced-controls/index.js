/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	__experimentalStyleProvider as StyleProvider,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit/context';

const name = 'InspectorAdvancedControls';
const { Fill, Slot } = createSlotFill( name );

function InspectorAdvancedControls( { children } ) {
	const { isSelected } = useBlockEditContext();
	return isSelected ? (
		<StyleProvider document={ document }>
			<Fill>{ children }</Fill>
		</StyleProvider>
	) : null;
}

InspectorAdvancedControls.slotName = name;
InspectorAdvancedControls.Slot = Slot;

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-advanced-controls/README.md
 */
export default InspectorAdvancedControls;
