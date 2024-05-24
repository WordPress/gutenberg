/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { ProgressBar } from '..';

const meta: Meta< typeof ProgressBar > = {
	component: ProgressBar,
	title: 'Components/ProgressBar',
	argTypes: {
		value: { control: { type: 'number', min: 0, max: 100, step: 1 } },
		hasUnconstrainedWidth: { control: 'boolean' },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};

export default meta;

const Template: StoryFn< typeof ProgressBar > = ( { ...args } ) => {
	return <ProgressBar { ...args } />;
};

export const Default: StoryFn< typeof ProgressBar > = Template.bind( {} );
Default.args = {};

/**
 * A progress bar that expands to fill its container, ignoring the default `max-width`.
 *
 * You can also further customize the width behavior by passing your own CSS class in
 * the `cssName` prop.
 */
export const UnconstrainedWidth: StoryFn< typeof ProgressBar > = Template.bind(
	{}
);
UnconstrainedWidth.args = {
	hasUnconstrainedWidth: true,
};
