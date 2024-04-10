/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { TimeInput } from '../time-input';

const meta: Meta< typeof TimeInput > = {
	title: 'Components/TimeInput',
	component: TimeInput,
	argTypes: {
		onChange: { action: 'onChange', control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
	args: {},
};
export default meta;

const Template: StoryFn< typeof TimeInput > = ( { onChange, ...args } ) => {
	return <TimeInput { ...args } />;
};

export const Default: StoryFn< typeof TimeInput > = Template.bind( {} );
