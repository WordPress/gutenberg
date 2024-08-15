/**
 * Internal dependencies
 */
import InspectorControlsFill from './fill';
import InspectorControlsSlot from './slot';

const InspectorControls = InspectorControlsFill;

InspectorControls.Slot = InspectorControlsSlot;

// This is just here for backward compatibility.
export const InspectorAdvancedControls = ( props ) => {
	return <InspectorControlsFill { ...props } group="advanced" />;
};
InspectorAdvancedControls.Slot = ( props ) => {
	return <InspectorControlsSlot { ...props } group="advanced" />;
};
InspectorAdvancedControls.slotName = 'InspectorAdvancedControls';

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-controls/README.md
 */
export default InspectorControls;
