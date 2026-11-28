import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { AlignmentToolbar } from '..';

/**
 * The `AlignmentToolbar` component renders a dropdown menu that displays alignment options for the selected block in `Toolbar`.
 */
const meta: Meta< typeof AlignmentToolbar > = {
	id: 'blockeditor-alignmenttoolbar',
	title: 'Editor/Block Editor/AlignmentToolbar',
	component: AlignmentToolbar,
	argTypes: {
		value: {
			control: false,
			defaultValue: 'undefined',
			description: 'The current value of the alignment setting.',
		},
		onChange: {
			action: 'onChange',
			control: false,
			description:
				"A callback function invoked when the toolbar's alignment value is changed via an interaction with any of the toolbar's buttons. Called with the new alignment value (ie: `left`, `center`, `right`, `undefined`) as the only argument.",
		},
	},
};
export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState< string >();
		return (
			<AlignmentToolbar
				{ ...args }
				onChange={ ( ...changeArgs ) => {
					onChange( ...changeArgs );
					setValue( ...changeArgs );
				} }
				value={ value }
			/>
		);
	},
};
