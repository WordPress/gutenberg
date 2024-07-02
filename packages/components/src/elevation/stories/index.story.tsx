/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Elevation } from '..';

const meta: Meta< typeof Elevation > = {
	component: Elevation,
	title: 'Components (Experimental)/Elevation',
	argTypes: {
		as: { control: { type: 'text' } },
		borderRadius: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof Elevation > = ( args ) => {
	return (
		<div
			style={ {
				width: 150,
				height: 150,
				position: 'relative',
			} }
		>
			<Elevation { ...args } />
		</div>
	);
};

const InteractiveTemplate: StoryFn< typeof Elevation > = ( args ) => {
	return (
		<button
			style={ {
				border: 0,
				background: 'transparent',
				width: 150,
				height: 150,
				position: 'relative',
			} }
		>
			Click me
			<Elevation { ...args } />
		</button>
	);
};

export const Default: StoryFn< typeof Elevation > = Template.bind( {} );
Default.args = {
	value: 5,
};

/**
 * Enable the `isInteractive` prop to automatically generate values
 * for the hover/active/focus states.
 */
export const WithInteractive: StoryFn< typeof Elevation > =
	InteractiveTemplate.bind( {} );
WithInteractive.args = {
	...Default.args,
	isInteractive: true,
};

/**
 * You can also provide custom values for the hover/active/focus states
 * instead of using the `isInteractive` prop.
 */
export const WithCustomInteractive: StoryFn< typeof Elevation > =
	InteractiveTemplate.bind( {} );
WithCustomInteractive.args = {
	...Default.args,
	hover: 7,
	active: 1,
	focus: 10,
};
