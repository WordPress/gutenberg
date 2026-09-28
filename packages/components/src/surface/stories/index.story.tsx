import { expect } from 'storybook/test';
import { logged } from '@wordpress/deprecated';
import type { Meta, StoryFn } from '@storybook/react-vite';
import { Surface } from '..';
import { Text } from '../../text';

const meta: Meta< typeof Surface > = {
	component: Surface,
	title: 'Components/@wordpress-components/Deprecated/Surface',
	id: 'components-surface',
	argTypes: {
		children: { control: false },
		as: { control: { type: 'text' } },
	},
	tags: [ 'status-experimental' ],
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Deprecated. Write your own CSS instead, preferably using the [`design tokens`](?path=/docs/design-system-tokens-introduction--docs) available in `@wordpress/theme`.',
		},
	},
	play: () => {
		expect(
			logged[
				'wp.components.__experimentalSurface is deprecated since version 7.2 and will be removed in version 7.4.'
			]
		).toBe( true );
	},
};
export default meta;

const Template: StoryFn< typeof Surface > = ( args ) => {
	return (
		<Surface
			{ ...args }
			style={ { padding: 20, maxWidth: 400, margin: '20vh auto' } }
		>
			<Text>Code is Poetry</Text>
		</Surface>
	);
};

export const Default: StoryFn< typeof Surface > = Template.bind( {} );
Default.args = {};
