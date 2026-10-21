import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import HeadingLevelDropdown from '../';

const meta: Meta< typeof HeadingLevelDropdown > = {
	id: 'blockeditor-headingleveldropdown',
	title: 'Editor/Block Editor/HeadingLevelDropdown',
	component: HeadingLevelDropdown,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Dropdown for selecting a heading level (1 through 6) or paragraph (0).',
			},
		},
	},
	argTypes: {
		value: {
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			description: 'The chosen heading level.',
		},
		options: {
			control: 'check',
			options: [ 1, 2, 3, 4, 5, 6 ],
			description: 'An array of supported heading levels.',
		},
		onChange: {
			action: 'onChange',
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			description: 'Function called with the selected value changes.',
		},
	},
};

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState( args.value );

		return (
			<HeadingLevelDropdown
				{ ...args }
				value={ value }
				onChange={ ( ...changeArgs ) => {
					setValue( ...changeArgs );
					onChange( ...changeArgs );
				} }
			/>
		);
	},
	args: {
		value: 2,
	},
};
