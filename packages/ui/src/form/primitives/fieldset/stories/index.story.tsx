import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Fieldset from '../';
import { DETAILS_EXAMPLE } from '../../../stories/shared';

const meta: Meta< typeof Fieldset.Root > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Form/Primitives/Fieldset',
	component: Fieldset.Root,
	// Temporary: Due to an upstream bug, render the root explicitly so the
	// components manifest extractor can resolve props from the JSX.
	//
	// See: https://github.com/storybookjs/storybook/issues/34877
	render: ( args ) => <Fieldset.Root { ...args } />,
	subcomponents: {
		'Fieldset.Legend': Fieldset.Legend,
		'Fieldset.Description': Fieldset.Description,
		'Fieldset.Details': Fieldset.Details,
	},
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Fieldset.Root >;

export const Default: Story = {
	args: {
		children: [
			<Fieldset.Legend key="legend">Legend</Fieldset.Legend>,
			[ 'Apples', 'Bananas' ].map( ( fruit ) => (
				// eslint-disable-next-line jsx-a11y/label-has-associated-control
				<label key={ fruit }>
					<input type="checkbox" /> { fruit }
				</label>
			) ),
			<Fieldset.Description key="description">
				This is a description for the entire fieldset.
			</Fieldset.Description>,
		],
	},
};

/**
 * When `hideFromVision` is set on `Fieldset.Legend`, the legend is visually
 * hidden but remains accessible to screen readers.
 */
export const HiddenLegend: Story = {
	args: {
		children: [
			<Fieldset.Legend hideFromVision key="legend">
				Legend
			</Fieldset.Legend>,
			[ 'Apples', 'Bananas' ].map( ( fruit ) => (
				// eslint-disable-next-line jsx-a11y/label-has-associated-control
				<label key={ fruit }>
					<input type="checkbox" /> { fruit }
				</label>
			) ),
		],
	},
};

/**
 * To add rich content (such as links) to the description, use `Fieldset.Details`.
 *
 * Although this content is not associated with the fieldset using direct semantics,
 * it is made discoverable to screen reader users via a visually hidden description,
 * alerting them to the presence of additional information below.
 *
 * If the content only includes plain text, use `Fieldset.Description` instead,
 * so the readout is not unnecessarily verbose for screen reader users.
 */
export const WithDetails: Story = {
	args: {
		children: [
			<Fieldset.Legend key="legend">Legend</Fieldset.Legend>,
			[ 'Apples', 'Bananas' ].map( ( fruit ) => (
				// eslint-disable-next-line jsx-a11y/label-has-associated-control
				<label key={ fruit }>
					<input type="checkbox" /> { fruit }
				</label>
			) ),
			<Fieldset.Details key="details">
				{ DETAILS_EXAMPLE }
			</Fieldset.Details>,
		],
	},
};
