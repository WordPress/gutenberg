/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Heading } from '..';

const meta: ComponentMeta< typeof Heading > = {
	component: Heading,
	title: 'Components (Experimental)/Heading',
	argTypes: {
		color: { control: { type: 'color' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

export const Default: ComponentStory< typeof Heading > = ( props ) => (
	<Heading { ...props } />
);
Default.args = {
	children: 'Heading',
};
