import type { ComponentProps } from 'react';
import InspectorControlsFill from './fill';
import InspectorControlsSlot from './slot';
import type { InspectorControlsFillProps } from './types';

// TypeScript only types a property set on a function declared in this file.
const InspectorControls =
	InspectorControlsFill as typeof InspectorControlsFill & {
		Slot: typeof InspectorControlsSlot;
	};

InspectorControls.Slot = InspectorControlsSlot;

// This is just here for backward compatibility.
export const InspectorAdvancedControls = (
	props: InspectorControlsFillProps
) => {
	return <InspectorControlsFill { ...props } group="advanced" />;
};
InspectorAdvancedControls.Slot = function Slot(
	props: ComponentProps< typeof InspectorControlsSlot >
) {
	return <InspectorControlsSlot { ...props } group="advanced" />;
};
InspectorAdvancedControls.slotName = 'InspectorAdvancedControls';

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-controls/README.md
 */
export default InspectorControls;
