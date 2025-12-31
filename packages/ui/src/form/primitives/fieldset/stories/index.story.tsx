import type { Meta, StoryObj } from '@storybook/react';
import { Fieldset } from '../../../..';

const meta: Meta< typeof Fieldset.Root > = {
	title: 'Design System/Components/Form/Primitives/Fieldset',
	component: Fieldset.Root,
	subcomponents: {
		Legend: Fieldset.Legend,
		Description: Fieldset.Description,
	},
};
export default meta;

type Story = StoryObj< typeof Fieldset.Root >;

export const Default: Story = {
	args: {
		children: (
			<>
				<Fieldset.Legend>Legend</Fieldset.Legend>
				{ [ 'Apples', 'Bananas' ].map( ( fruit ) => (
					// eslint-disable-next-line jsx-a11y/label-has-associated-control
					<label key={ fruit }>
						<input type="checkbox" /> { fruit }
					</label>
				) ) }
			</>
		),
	},
};

export const WithDescription: Story = {
	args: {
		children: (
			<>
				<Fieldset.Legend>Legend</Fieldset.Legend>
				{ [ 'Apples', 'Bananas' ].map( ( fruit ) => (
					// eslint-disable-next-line jsx-a11y/label-has-associated-control
					<label key={ fruit }>
						<input type="checkbox" /> { fruit }
					</label>
				) ) }
				<Fieldset.Description>
					This is a description for the entire fieldset.
				</Fieldset.Description>
			</>
		),
	},
};
