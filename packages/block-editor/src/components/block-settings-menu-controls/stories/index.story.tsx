import BlockSettingsMenuControls from '../';

/**
 * Storybook metadata
 */
const meta = {
	title: 'BlockEditor/BlockSettingsMenuControls',
	component: BlockSettingsMenuControls,
	parameters: {
		docs: {
			description: {
				component:
					'The `BlockSettingsMenuControls` component renders additional controls within the block settings menu, allowing for customization and extension of block options.',
			},
			canvas: { sourceState: 'shown' },
		},
	},
	argTypes: {
		clientIds: {
			control: 'array',
			description:
				'Array of clientIds for the blocks that will be acted upon. Determines which blocks the menu controls will affect.',
			table: {
				type: { summary: 'Array' },
			},
		},
		fillProps: {
			control: 'object',
			description:
				'Additional props to pass to the Slot fill. Can include properties like `onClose` to handle menu interactions.',
			table: {
				type: { summary: 'Object' },
			},
		},
	},
};

export default meta;

type SlotArgs = {
	clientIds: string[];
	fillProps: { onClose: () => void };
};

/**
 * Default Story
 */
export const Default = {
	args: {
		clientIds: [ 'block-1', 'block-2' ],
		fillProps: {
			onClose: () => {},
		},
	},
	render: function Template( { clientIds, fillProps }: SlotArgs ) {
		return (
			<BlockSettingsMenuControls.Slot
				clientIds={ clientIds }
				fillProps={ fillProps }
			/>
		);
	},
};
