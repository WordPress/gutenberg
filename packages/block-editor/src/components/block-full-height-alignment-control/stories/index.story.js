/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import BlockFullHeightAlignmentControl from '../';

registerCoreBlocks();

const meta = {
	title: 'BlockEditor/BlockFullHeightAlignmentControl',
	component: BlockFullHeightAlignmentControl,
	parameters: {
		docs: { canvas: { sourceState: 'shown' } },
	},
	argTypes: {
		isActive: {
			control: 'boolean',
			description: 'Whether the full height alignment is active.',
		},
		label: {
			control: 'text',
			description: 'Label for the button in the toolbar.',
		},
		onToggle: {
			action: 'onToggle',
			description:
				'Callback function to toggle the active state of the button.',
		},
		isDisabled: {
			control: 'boolean',
			description: 'Whether the button is disabled.',
		},
	},
};
export default meta;

export const Default = {
	args: {
		isActive: true,
	},
};
