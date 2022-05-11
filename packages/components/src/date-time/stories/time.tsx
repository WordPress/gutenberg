/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import TimePicker from '../time';

const meta: ComponentMeta< typeof TimePicker > = {
	title: 'Components/TimePicker',
	component: TimePicker,
	argTypes: {
		currentTime: { control: 'date' },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof TimePicker > = ( args ) => (
	<TimePicker { ...args } />
);

export const Default: ComponentStory< typeof TimePicker > = Template.bind( {} );
