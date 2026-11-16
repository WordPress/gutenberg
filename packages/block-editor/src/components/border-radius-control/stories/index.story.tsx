import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import BorderRadiusControl from '../';

const meta: Meta< typeof BorderRadiusControl > = {
	id: 'blockeditor-borderradiuscontrol',
	title: 'Editor/Block Editor/BorderRadiusControl',
	component: BorderRadiusControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component: 'Control to display border radius options.',
			},
		},
	},
	argTypes: {
		values: {
			control: 'object',
			description: 'Border radius values.',
			table: {
				type: { summary: 'object' },
			},
		},
		onChange: {
			action: 'onChange',
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			table: {
				type: { summary: 'function' },
			},
			description: 'Callback to handle onChange.',
		},
	},
};

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	render: function Template( { onChange, ...args } ) {
		const [ values, setValues ] = useState( args.values );

		return (
			<BorderRadiusControl
				{ ...args }
				values={ values }
				onChange={ ( ...changeArgs ) => {
					setValues( ...changeArgs );
					onChange( ...changeArgs );
				} }
			/>
		);
	},
};
