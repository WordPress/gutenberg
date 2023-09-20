/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import TimePicker from '../time';

const meta: Meta< typeof TimePicker > = {
	title: 'Components/TimePicker',
	component: TimePicker,
	argTypes: {
		currentTime: { control: 'date' },
		onChange: { action: 'onChange', control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof TimePicker > = ( {
	currentTime,
	onChange,
	...args
} ) => {
	return (
		<TimePicker
				{...args}
				currentTime={ new Date() }
				onChange={ ( date ) => console.log("logging here: ", date) }
		/>
	);
};

export const Default: StoryFn< typeof TimePicker > = Template.bind( {} );
