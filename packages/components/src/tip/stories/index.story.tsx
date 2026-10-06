import type { Meta, StoryFn } from '@storybook/react-vite';
import Tip from '..';
import ExternalLink from '../../external-link';

const meta: Meta< typeof Tip > = {
	component: Tip,
	title: 'Components/@wordpress-components/Feedback/Tip',
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
			status: 'unaudited',
			whereUsed: 'global',
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

export const WithExternalLink: StoryFn< typeof Tip > = Template.bind( {} );
WithExternalLink.args = {
	children: (
		<>
			Interested in creating your own block?
			<br />
			<ExternalLink href="https://developer.wordpress.org/block-editor/">
				Get started here.
			</ExternalLink>
		</>
	),
};
