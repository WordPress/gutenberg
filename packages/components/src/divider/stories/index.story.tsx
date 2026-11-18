import type { Meta, StoryFn } from '@storybook/react-vite';
import { Text } from '../../text';
import Divider from '../deprecated';
import { Flex } from '../../flex';

const meta: Meta< typeof Divider > = {
	component: Divider,
	title: 'Components/@wordpress-components/Deprecated/Divider',
	id: 'components-divider',
	argTypes: {
		margin: {
			control: { type: 'text' },
		},
		marginStart: {
			control: { type: 'text' },
		},
		marginEnd: {
			control: { type: 'text' },
		},
		wrapElement: {
			control: false,
		},
		ref: {
			table: {
				disable: true,
			},
		},
	},
	tags: [ 'status-experimental' ],
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Deprecated. Prefer a `Separator` subcomponent such as [`Menu.Separator`](?path=/docs/design-system-components-menu--docs) when the surrounding component provides one. Otherwise write your own CSS, preferably using the [`design tokens`](?path=/docs/design-system-tokens-introduction--docs) available in `@wordpress/theme`.',
		},
	},
};
export default meta;

const Template: StoryFn< typeof Divider > = ( args ) => (
	<div>
		<Text>Some text before the divider</Text>
		<Divider { ...args } />
		<Text>Some text after the divider</Text>
	</div>
);

export const Horizontal: StoryFn< typeof Divider > = Template.bind( {} );
Horizontal.args = {
	margin: '2',
};

export const Vertical: StoryFn< typeof Divider > = Template.bind( {} );
Vertical.args = {
	...Horizontal.args,
	orientation: 'vertical',
};

// Inside a `flex` container, the divider will need to be `stretch` aligned in order to be visible.
export const InFlexContainer: StoryFn< typeof Divider > = ( args ) => {
	return (
		<Flex align="stretch">
			<Text>
				Some text before the divider Some text before the divider Some
				text before the divider Some text before the divider Some text
				before the divider Some text before the divider Some text before
				the divider
			</Text>
			<Divider { ...args } />
			<Text>
				Some text after the divider Some text after the divider Some
				text after the divider
			</Text>
		</Flex>
	);
};
InFlexContainer.args = {
	...Vertical.args,
};
