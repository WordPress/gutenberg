/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Elevation } from '..';

const meta: ComponentMeta< typeof Elevation > = {
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
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof Elevation > = ( args ) => {
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

const InteractiveTemplate: ComponentStory< typeof Elevation > = ( args ) => {
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

export const Default: ComponentStory< typeof Elevation > = Template.bind( {} );
Default.args = {
	value: 5,
};

/**
 * Enable the `isInteractive` prop to automatically generate values
 * for the hover/active/focus states.
 */
export const WithInteractive: ComponentStory< typeof Elevation > =
	InteractiveTemplate.bind( {} );
WithInteractive.args = {
	...Default.args,
	isInteractive: true,
};

/**
 * You can also provide custom values for the hover/active/focus states
 * instead of using the `isInteractive` prop.
 */
export const WithCustomInteractive: ComponentStory< typeof Elevation > =
	InteractiveTemplate.bind( {} );
WithCustomInteractive.args = {
	...Default.args,
	hover: 7,
	active: 1,
	focus: 10,
};
