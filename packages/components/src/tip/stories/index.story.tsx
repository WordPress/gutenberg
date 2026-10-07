import type { Meta, StoryFn } from '@storybook/react-vite';
import Tip from '..';

const meta: Meta< typeof Tip > = {
	component: Tip,
	title: 'Components/@wordpress-components/Deprecated/Tip',
	id: 'components-tip',
	argTypes: {
		children: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Deprecated. Use [`Notice`](?path=/docs/design-system-components-notice--docs) from `@wordpress/ui` instead.',
		},
	},
};
export default meta;

const Template: StoryFn< typeof Tip > = ( args ) => {
	return <Tip { ...args } />;
};

export const Default: StoryFn< typeof Tip > = Template.bind( {} );
Default.args = {
	children: 'An example tip',
};
