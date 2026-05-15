/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { AlignmentToolbar } from '..';

/**
 * The `AlignmentToolbar` component renders a dropdown menu that displays alignment options for the selected block in `Toolbar`.
 */
const meta = {
	title: 'BlockEditor/AlignmentToolbar',
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

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState();
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
