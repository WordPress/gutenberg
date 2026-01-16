import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fieldset } from '../../../..';

const meta: Meta< typeof Fieldset.Root > = {
	title: 'Design System/Components/Form/Primitives/Fieldset',
	component: Fieldset.Root,
	subcomponents: {
		Legend: Fieldset.Legend,
		Description: Fieldset.Description,
		Details: Fieldset.Details,
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
				<Fieldset.Description>
					This is a description for the entire fieldset.
				</Fieldset.Description>
			</>
		),
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
		children: (
			<>
				<Fieldset.Legend>Legend</Fieldset.Legend>
				{ [ 'Apples', 'Bananas' ].map( ( fruit ) => (
					// eslint-disable-next-line jsx-a11y/label-has-associated-control
					<label key={ fruit }>
						<input type="checkbox" /> { fruit }
					</label>
				) ) }
				<Fieldset.Details>
					Details can include{ ' ' }
					<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a">
						links to more information
					</a>{ ' ' }
					and other semantic elements.
				</Fieldset.Details>
			</>
		),
	},
};
