/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import { Surface } from '..';
import { Text } from '../../text';

const meta: Meta< typeof Surface > = {
	component: Surface,
	title: 'Components/Surface',
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
			notes: 'Planned for deprecation.',
		},
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
