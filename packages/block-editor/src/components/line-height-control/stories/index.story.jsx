/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import LineHeightControl from '../';

const meta = {
	title: 'BlockEditor/LineHeightControl',
	component: LineHeightControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component: 'Control to manage line height settings.',
			},
		},
	},
	argTypes: {
		value: {
			control: { type: null },
			description: 'Currently selected line height value.',
			table: {
				type: {
					summary: 'string | number | undefined',
				},
			},
		},
		onChange: {
			action: 'onChange',
			control: { type: null },
			description: 'Handles change in line height selection.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		__next40pxDefaultSize: {
			control: 'boolean',
			description: 'Whether to use the 40px default size.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		__unstableInputWidth: {
			control: 'text',
			description: 'Width of the input field.',
			table: {
				type: { summary: 'string' },
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState();
		return (
			<LineHeightControl
				{ ...args }
				onChange={ ( ...changeArgs ) => {
					onChange( ...changeArgs );
					setValue( ...changeArgs );
				} }
				value={ value }
			/>
		);
	},
	args: {
		__next40pxDefaultSize: true,
		__unstableInputWidth: '100px',
	},
};

export const UnconstrainedWidth = {
	...Default,
	args: {
		...Default.args,
		__unstableInputWidth: '100%',
	},
};
