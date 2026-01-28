/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import { Heading } from '..';

const meta: Meta< typeof Heading > = {
	component: Heading,
	title: 'Components/Typography/Heading',
	id: 'components-heading',
	argTypes: {
		as: { control: { type: 'text' } },
		color: { control: { type: 'color' } },
		display: { control: { type: 'text' } },
		letterSpacing: { control: { type: 'text' } },
		lineHeight: { control: { type: 'text' } },
		optimizeReadabilityFor: { control: { type: 'color' } },
		variant: {
			control: { type: 'select' },
			options: [ undefined, 'muted' ],
		},
		weight: { control: { type: 'text' } },
	},
	tags: [ 'status-experimental' ],
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

export const Default: StoryFn< typeof Heading > = ( props ) => (
	<Heading { ...props } />
);
Default.args = {
	children: 'Heading',
};
