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
	title: 'Components (Experimental)/ProgressBar',
	argTypes: {
		value: { control: { type: 'number', min: 0, max: 100, step: 1 } },
	},
	tags: [ 'status-private' ],
	parameters: {
		badges: [ 'private' ],
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
