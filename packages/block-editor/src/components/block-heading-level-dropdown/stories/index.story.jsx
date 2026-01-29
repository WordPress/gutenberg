/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from '../';

const meta = {
	title: 'BlockEditor/HeadingLevelDropdown',
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
			control: { type: null },
			description: 'Function called with the selected value changes.',
		},
	},
};

export default meta;

export const Default = {
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
