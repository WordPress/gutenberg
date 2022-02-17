/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Heading } from '..';

export default {
	component: Heading,
	title: 'Components (Experimental)/Heading',
	argTypes: {
		color: { control: { type: 'color' } },
	},
	parameters: {
		controls: { expanded: true },
	},
} as ComponentMeta< typeof Heading >;

export const Default: ComponentStory< typeof Heading > = ( props ) => (
	<Heading { ...props } />
);
Default.args = {
	children: 'Heading',
};
