import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import {
	envelope,
	link,
	lock,
	mobile,
	plus,
	reset,
	search,
	seen,
	unseen,
} from '@wordpress/icons';
import { InputControl } from '../';
import { Icon } from '../../../icon';
import { IconButton } from '../../../icon-button';
import { InputLayout } from '../../primitives/input-layout';
import { Stack } from '../../../stack';
import {
	WithPrefix as InputWithPrefix,
	WithSuffixControl as InputWithSuffixControl,
} from '../../primitives/input/stories/index.story';
import {
	WITH_DETAILS_DESCRIPTION,
	DETAILS_EXAMPLE,
} from '../../stories/shared';

const meta: Meta< typeof InputControl > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Form/InputControl',
	id: 'design-system-components-form-inputcontrol',
	component: InputControl,
	argTypes: {
		defaultValue: { control: false },
		onValueChange: { action: 'onValueChange' },
		value: { control: false },
		type: { control: 'text' },
	},
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof InputControl >;

export const Default: Story = {
	args: {
		label: 'Label',
		description: 'This is the description.',
		placeholder: 'Placeholder',
	},
};

export const VisuallyHiddenLabel: Story = {
	args: {
		...Default.args,
		hideLabelFromVision: true,
	},
};

export const WithDetails: Story = {
	parameters: {
		docs: { description: { story: WITH_DETAILS_DESCRIPTION } },
	},
	args: {
		...Default.args,
		description: undefined,
		details: DETAILS_EXAMPLE,
	},
};

export const WithPrefix: Story = {
	args: {
		...InputWithPrefix.args,
		ref: undefined,
		...Default.args,
	},
};

export const WithSuffixControl: Story = {
	args: {
		...InputWithSuffixControl.args,
		ref: undefined,
		...Default.args,
	},
	parameters: {
		a11y: { test: 'error' },
	},
};

export const Password: Story = {
	render: function Template( args ) {
		const [ show, setShow ] = useState( false );

		return (
			<InputControl
				{ ...args }
				type={ show ? 'text' : 'password' }
				prefix={
					<InputLayout.Slot padding="minimal">
						<Icon icon={ lock } />
					</InputLayout.Slot>
				}
				suffix={
					<InputLayout.Slot padding="minimal">
						<IconButton
							label={ show ? 'Hide password' : 'Show password' }
							onClick={ () => setShow( ! show ) }
							icon={ show ? unseen : seen }
							size="small"
							variant="minimal"
						/>
					</InputLayout.Slot>
				}
			/>
		);
	},
	args: {
		...Default.args,
		label: 'Password',
		description: undefined,
		placeholder: undefined,
		autoComplete: 'current-password',
		defaultValue: 'password',
	},
};

export const Date: Story = {
	args: {
		...Default.args,
		type: 'date',
	},
};

export const Number: Story = {
	args: {
		...Default.args,
		placeholder: '0',
		type: 'number',
	},
};

export const NumberWithSteppers: Story = {
	render: function Template( args ) {
		const [ value, setValue ] = useState( 0 );

		return (
			<InputControl
				{ ...args }
				value={ value }
				onValueChange={ ( v ) => setValue( parseInt( v, 10 ) ) }
				suffix={
					<InputLayout.Slot padding="minimal">
						<Stack direction="row" gap="xs">
							<IconButton
								label="Increment"
								icon={ plus }
								onClick={ () => setValue( value + 1 ) }
								size="small"
								variant="minimal"
							/>
							<IconButton
								label="Decrement"
								icon={ reset }
								onClick={ () => setValue( value - 1 ) }
								size="small"
								variant="minimal"
							/>
						</Stack>
					</InputLayout.Slot>
				}
			/>
		);
	},
	args: {
		...Number.args,
		type: 'number',
	},
};

/**
 * Common field types like this one can show an icon in the prefix. The icon
 * is decorative: the label already names the field, so `Icon` is hidden from
 * assistive technologies. Pair the `type` with a matching `autoComplete`
 * value where one exists.
 */
export const Email: Story = {
	args: {
		...Default.args,
		label: 'Email',
		description: undefined,
		placeholder: 'name@example.com',
		type: 'email',
		autoComplete: 'email',
		prefix: (
			<InputLayout.Slot padding="minimal">
				<Icon icon={ envelope } />
			</InputLayout.Slot>
		),
	},
};

export const Tel: Story = {
	args: {
		...Default.args,
		label: 'Phone number',
		description: undefined,
		placeholder: '+1 555 0100',
		type: 'tel',
		autoComplete: 'tel',
		prefix: (
			<InputLayout.Slot padding="minimal">
				<Icon icon={ mobile } />
			</InputLayout.Slot>
		),
	},
};

export const Url: Story = {
	args: {
		...Default.args,
		label: 'Website',
		description: undefined,
		placeholder: 'https://example.com',
		type: 'url',
		autoComplete: 'url',
		prefix: (
			<InputLayout.Slot padding="minimal">
				<Icon icon={ link } />
			</InputLayout.Slot>
		),
	},
};

export const Search: Story = {
	args: {
		...Default.args,
		label: 'Search',
		hideLabelFromVision: true,
		description: undefined,
		placeholder: 'Search',
		type: 'search',
		prefix: (
			<InputLayout.Slot padding="minimal">
				<Icon icon={ search } />
			</InputLayout.Slot>
		),
	},
};

export const Disabled: Story = {
	args: {
		...Default.args,
		defaultValue: 'Disabled value',
		disabled: true,
	},
};

export const ReadOnly: Story = {
	args: {
		...Default.args,
		defaultValue: 'Read-only value',
		readOnly: true,
	},
};
