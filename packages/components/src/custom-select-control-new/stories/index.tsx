/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
// import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	CustomSelectControl,
	CustomSelectControlItem,
	CustomSelectControlGroup,
	CustomSelectControlGroupLabel,
	CustomSelectControlSeparator,
} from '../';

const meta: ComponentMeta< typeof CustomSelectControl > = {
	component: CustomSelectControl,
	title: 'Components (Experimental)/CustomSelectControlNew',
	argTypes: {},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

// TODO:
// - with `options` prop
// - controlled vs uncontrolled
// - with HTML `<options />` (and related vanilla elements)?
// - example with custom author dropdown

export const Default: ComponentStory< typeof CustomSelectControl > = ( {
	onChange,
	...args
} ) => (
	<CustomSelectControl { ...args }>
		<CustomSelectControlItem value="Venus" />
		<CustomSelectControlItem value="Earth">
			{ /* Custom item label */ }
			Planet Earth
		</CustomSelectControlItem>
		<CustomSelectControlItem value="Mars" />
		<CustomSelectControlItem value="Jupiter" disabled />
		<CustomSelectControlItem value="Neptune" />
	</CustomSelectControl>
);
Default.args = {
	label: 'Choose a planet',
};

export const WithGroupsAndSeparators: ComponentStory<
	typeof CustomSelectControl
> = ( { onChange, ...args } ) => (
	<CustomSelectControl { ...args }>
		<CustomSelectControlGroup>
			<CustomSelectControlGroupLabel>
				Primary
			</CustomSelectControlGroupLabel>
			<CustomSelectControlItem value="Red" />
			<CustomSelectControlItem value="Yellow" />
			<CustomSelectControlItem value="Blue" />
		</CustomSelectControlGroup>
		<CustomSelectControlSeparator />
		<CustomSelectControlGroup>
			<CustomSelectControlGroupLabel>
				Secondary
			</CustomSelectControlGroupLabel>
			<CustomSelectControlItem value="Orange" />
			<CustomSelectControlItem value="Green" />
			<CustomSelectControlItem value="Purple" />
		</CustomSelectControlGroup>
		<CustomSelectControlSeparator />
		<CustomSelectControlGroup>
			<CustomSelectControlGroupLabel>
				Tertiary
			</CustomSelectControlGroupLabel>
			<CustomSelectControlItem value="Amber" />
			<CustomSelectControlItem value="Vermilion" />
			<CustomSelectControlItem value="Magenta" />
			<CustomSelectControlItem value="Violet" />
			<CustomSelectControlItem value="Teal" />
			<CustomSelectControlItem value="Chartreuse" />
		</CustomSelectControlGroup>
	</CustomSelectControl>
);
WithGroupsAndSeparators.args = {
	label: 'Pick a color',
};
