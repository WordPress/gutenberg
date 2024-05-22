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

const Template: StoryFn< typeof ProgressBar > = ( { ...args } ) => (
	<ProgressBar { ...args } />
);

export const Default: StoryFn< typeof ProgressBar > = Template.bind( {} );
Default.args = {};

export const WithDefaultSuggestedWidth: StoryFn = ( {
	className,
	...args
} ) => (
	<>
		<style>
			{ `
				.progressbar-story-custom-width {
					width: 160px;
				}
			` }
		</style>
		<ProgressBar { ...args } className={ className } />
	</>
);
WithDefaultSuggestedWidth.args = {
	className: 'progressbar-story-custom-width',
};
WithDefaultSuggestedWidth.parameters = {
	docs: {
		description: {
			story: 'For most screens with a wide-enough viewport, we recommend a maximum width of 160px. You can set a custom width by passing a CSS class via the `className` prop (depicted below) or by setting the width of the parent container.',
		},
	},
};
