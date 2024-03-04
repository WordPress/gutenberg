/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Surface } from '..';
import { Text } from '../../text';

const meta: Meta< typeof Surface > = {
	component: Surface,
	title: 'Components (Experimental)/Surface',
	argTypes: {
		children: { control: { type: null } },
		as: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
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
