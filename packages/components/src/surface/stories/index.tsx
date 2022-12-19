/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Surface } from '..';
import { Text } from '../../text';

const meta: ComponentMeta< typeof Surface > = {
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
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof Surface > = ( args ) => {
	return (
		<Surface
			{ ...args }
			style={ { padding: 20, maxWidth: 400, margin: '20vh auto' } }
		>
			<Text>Code is Poetry</Text>
		</Surface>
	);
};

export const Default: ComponentStory< typeof Surface > = Template.bind( {} );
Default.args = {};
