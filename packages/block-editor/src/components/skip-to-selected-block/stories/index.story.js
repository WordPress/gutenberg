/**
 * Internal dependencies
 */
import SkipToSelectedBlock from '../';

const meta = {
	title: 'BlockEditor/SkipToSelectedBlock',
	component: SkipToSelectedBlock,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'It provides a way for keyboard and assistive technologies users to jump back to the currently selected block.',
			},
		},
	},
	argTypes: {
		selectedBlockClientId: {
			control: { type: 'string' },
			description: 'Reference ID of the currently selected block.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { ...args } ) {
		return <SkipToSelectedBlock { ...args } />;
	},
};
