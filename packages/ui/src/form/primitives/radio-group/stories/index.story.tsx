import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from '../../radio';
import { RadioGroup } from '../';

const meta: Meta< typeof RadioGroup > = {
	title: 'Components/@wordpress-ui/Form/Primitives/RadioGroup',
	id: 'design-system-components-form-primitives-radiogroup',
	component: RadioGroup,
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};

export default meta;

type Story = StoryObj< typeof RadioGroup >;

export const Default: Story = {
	args: {
		'aria-label': 'Fruit',
	},
	render: ( args ) => (
		<RadioGroup { ...args }>
			{ [ 'Apple', 'Banana', 'Orange' ].map( ( label ) => (
				<Radio key={ label } value={ label } aria-label={ label } />
			) ) }
		</RadioGroup>
	),
};

export const Checked: Story = {
	args: {
		...Default.args,
		defaultValue: 'Apple',
	},
	render: Default.render,
};

export const Disabled: Story = {
	args: {
		...Default.args,
		defaultValue: 'Apple',
		disabled: true,
	},
	render: Default.render,
};
