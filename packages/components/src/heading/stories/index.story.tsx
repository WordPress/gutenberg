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
		componentStatus: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use `Text` from `@wordpress/ui` instead, with the `render` prop set to the heading level element and the variant set to the visual heading size (e.g. `<Text render={ <h1 /> } variant="heading-2xl">`).',
		},
	},
};
export default meta;

export const Default: StoryFn< typeof Heading > = ( props ) => (
	<Heading { ...props } />
);
Default.args = {
	children: 'Heading',
};
