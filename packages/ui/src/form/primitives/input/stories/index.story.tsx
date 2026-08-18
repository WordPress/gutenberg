import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '../';
import { InputLayout } from '../../input-layout';
import { WithSuffixControl } from '../../input-layout/stories/index.story';
import * as Field from '../../field';

const meta: Meta< typeof Input > = {
	title: 'Design System/Components/Form/Primitives/Input',
	component: Input,
	argTypes: {
		defaultValue: { control: false },
		onValueChange: { action: 'onValueChange' },
		value: { control: false },
		type: { control: 'text' },
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Input >;

export const Default: Story = {
	args: {
		placeholder: 'Placeholder',
	},
};

/**
 * The `InputLayout.Slot` component can be used to add standard padding in
 * the `prefix` or `suffix` slot.
 */
export const WithPrefix: Story = {
	args: {
		placeholder: 'username',
		prefix: <InputLayout.Slot>@</InputLayout.Slot>,
	},
};

WithSuffixControl.args = {
	...WithSuffixControl.args,
	children: undefined,
};
// Input has no built-in label; paired with Field.Label here so the
// example is copy-paste safe.
WithSuffixControl.render = ( args ) => (
	<Field.Root>
		<Field.Label>Coupon code</Field.Label>
		<Field.Control render={ <Input suffix={ args.suffix } /> } />
	</Field.Root>
);
export { WithSuffixControl };

export const Disabled: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
};
