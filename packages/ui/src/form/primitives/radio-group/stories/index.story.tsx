import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from '../../radio';
import { RadioGroup } from '../';

const meta: Meta< typeof RadioGroup > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Form/Primitives/RadioGroup',
	id: 'design-system-components-form-primitives-radiogroup',
	component: RadioGroup,
	argTypes: {
		onValueChange: { action: 'onValueChange' },
	},
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
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
