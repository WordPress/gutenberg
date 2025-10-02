/**
 * Internal dependencies
 */
import ToolSelector from '..';

const meta = {
	title: 'BlockEditor/ToolSelector',
	component: ToolSelector,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'The ToolSelector component is used to switch between the navigation and edit modes in the block editor.',
			},
		},
	},
	argTypes: {
		props: {
			control: 'object',
			description: 'Props for the ToolSelector component',
			table: {
				type: { summary: 'object' },
			},
		},
		ref: {
			control: null,
			description: 'Ref for the ToolSelector component',
			table: {
				type: { summary: 'object' },
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( args ) {
		return <ToolSelector { ...args } />;
	},
};
