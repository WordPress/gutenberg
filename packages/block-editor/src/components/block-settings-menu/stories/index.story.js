/**
 * Internal dependencies
 */
import BlockSettingsMenu from '../';

/**
 * Storybook metadata
 */
const meta = {
	title: 'BlockEditor/BlockSettingsMenu',
	component: BlockSettingsMenu,
	parameters: {
		docs: {
			description: {
				component:
					'The `BlockSettingsMenu` component displays the block settings menu, with options like duplicate, remove, etc. It wraps the `BlockSettingsDropdown` and provides toolbar functionality.',
			},
			canvas: { sourceState: 'shown' },
		},
	},
	argTypes: {
		clientIds: {
			control: 'array',
			description:
				'Array of clientIds for the blocks that will be acted upon. Can be used to control block actions like duplicate or delete.',
			table: {
				type: { summary: 'Array' },
			},
		},
		__experimentalSelectBlock: {
			control: 'function',
			description:
				'A callback for selecting a block. When provided, interacting with the dropdown options (like duplicate) will not update the editor selection.',
			table: {
				type: { summary: 'function' },
			},
		},
	},
};

export default meta;

/**
 * Default Story
 */
export const Default = {
	args: {
		clientIds: [ 'block-1', 'block-2' ],
		__experimentalSelectBlock: () => {},
	},
	render: function Template( { clientIds, __experimentalSelectBlock } ) {
		return (
			<BlockSettingsMenu
				clientIds={ clientIds }
				__experimentalSelectBlock={ __experimentalSelectBlock }
			/>
		);
	},
};
