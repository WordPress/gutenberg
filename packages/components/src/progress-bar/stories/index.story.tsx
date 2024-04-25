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
		width: { control: { type: 'number', min: 0, step: 10 } },
	},
	tags: [ 'status-private' ],
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

// The ProgressBar width can be overriden (in pixels) and it will expand to that size if
// the parent has enough horizontal space. It is interpolated into the `width` property
// of the `Track` component using the `px` unit.
export const CustomWidth: StoryFn< typeof ProgressBar > = Template.bind( {} );
CustomWidth.args = { width: 400 };
