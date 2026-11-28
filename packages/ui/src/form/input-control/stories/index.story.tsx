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
import styles from './style.module.css';

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
 * Common field types can show an icon in the prefix. The icon is decorative:
 * the label already names the field, so `Icon` is hidden from assistive
 * technologies.
 *
 * Set `type` by the kind of value, and choose `autoComplete` by the field's
 * purpose. For example, an email address used to sign in can use
 * `type="email"` with `autoComplete="username"`.
 */
export const WithPrefixIcon: Story = {
	render: function Template( args ) {
		return (
			<Stack direction="column" gap="lg">
				<InputControl
					{ ...args }
					label="Email"
					placeholder="name@example.com"
					type="email"
					autoComplete="email"
					prefix={
						<InputLayout.Slot padding="minimal">
							<Icon icon={ envelope } />
						</InputLayout.Slot>
					}
				/>
				<InputControl
					{ ...args }
					label="Phone number"
					placeholder="+1 555 0100"
					type="tel"
					autoComplete="tel"
					prefix={
						<InputLayout.Slot padding="minimal">
							<Icon icon={ mobile } />
						</InputLayout.Slot>
					}
				/>
				<InputControl
					{ ...args }
					label="Website"
					placeholder="https://example.com"
					type="url"
					autoComplete="url"
					prefix={
						<InputLayout.Slot padding="minimal">
							<Icon icon={ link } />
						</InputLayout.Slot>
					}
				/>
			</Stack>
		);
	},
};

/**
 * A search field uses `type="search"`. Some browsers show a native button to
 * clear the query, and clear it on Escape.
 */
export const Search: Story = {
	args: {
		label: 'Search',
		hideLabelFromVision: true,
		placeholder: 'Search',
		type: 'search',
		defaultValue: 'Pizza',
		prefix: (
			<InputLayout.Slot padding="minimal">
				<Icon icon={ search } className={ styles[ 'search-icon' ] } />
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
