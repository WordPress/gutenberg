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
		adjustLineHeightForInnerControls: { control: { type: 'text' } },
		as: { control: { type: 'text' } },
		color: { control: { type: 'color' } },
		display: { control: { type: 'text' } },
		letterSpacing: { control: { type: 'text' } },
		lineHeight: { control: { type: 'text' } },
		optimizeReadabilityFor: { control: { type: 'color' } },
		variant: { control: { type: 'radio' }, options: [ 'muted' ] },
		weight: { control: { type: 'text' } },
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
