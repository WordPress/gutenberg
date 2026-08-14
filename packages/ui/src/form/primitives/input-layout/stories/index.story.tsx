import type { Meta, StoryObj } from '@storybook/react-vite';
import { copy } from '@wordpress/icons';
import { InputLayout } from '../input-layout';
import { InputLayout as _InputLayout } from '../';
import { IconButton } from '../../../../icon-button';

const meta: Meta< typeof InputLayout > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Form/Primitives/InputLayout',
	component: InputLayout,
	subcomponents: {
		'InputLayout.Slot': _InputLayout.Slot,
	},
	// Temporary: Due to an upstream bug, render the component explicitly so the
	// components manifest extractor can resolve props from the JSX. The public
	// export is a compound `Object.assign`, so point `component` at the
	// implementation module instead.
	//
	// See: https://github.com/storybookjs/storybook/issues/34877
	render: ( args ) => <InputLayout { ...args } />,
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
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
		prefix: <_InputLayout.Slot>https://</_InputLayout.Slot>,
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
			<_InputLayout.Slot padding="minimal">
				<IconButton
					size="small"
					variant="minimal"
					icon={ copy }
					label="Copy"
				/>
			</_InputLayout.Slot>
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
