import type { Meta, StoryObj } from '@storybook/react-vite';
import { copy } from '@wordpress/icons';
import { InputLayout } from '../';
import { IconButton } from '../../../../icon-button';

const meta: Meta< typeof InputLayout > = {
	title: 'Design System/Components/Form/Primitives/InputLayout',
	component: InputLayout,
	subcomponents: {
		'InputLayout.Slot': InputLayout.Slot,
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

type Story = StoryObj< typeof InputLayout >;

export const Default: Story = {
	args: {},
};

/**
 * By default, the `prefix` and `suffix` slots are rendered with no padding.
 */
export const WithPrefix: Story = {
	args: {
		prefix: (
			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					height: '100%',
					aspectRatio: '1 / 1',
					background: '#eee',
				} }
			>
				$
			</div>
		),
	},
};

/**
 * The `InputLayout.Slot` component can be used to add standard padding in
 * the `prefix` or `suffix` slot.
 *
 * The `padding="minimal"` setting will work best when the slot content is a button or icon.
 */
export const WithPaddedPrefix: Story = {
	args: {
		prefix: <InputLayout.Slot>https://</InputLayout.Slot>,
	},
};

/**
 * The `padding="minimal"` setting on `InputLayout.Slot` will work best when
 * the slot content is a button or icon.
 */
export const WithSuffixControl: Story = {
	args: {
		children: <div style={ { flex: 1 } } />,
		suffix: (
			<InputLayout.Slot padding="minimal">
				<IconButton
					size="small"
					variant="minimal"
					icon={ copy }
					label="Copy"
				/>
			</InputLayout.Slot>
		),
	},
};

export const Compact: Story = {
	args: {
		size: 'compact',
	},
};

/**
 * The `small` size is intended only for rare cases like the trigger
 * button of a low-profile `select` element.
 */
export const Small: Story = {
	args: {
		size: 'small',
	},
};
