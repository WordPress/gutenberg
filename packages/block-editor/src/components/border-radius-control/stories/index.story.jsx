/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BorderRadiusControl from '../';

const meta = {
	title: 'BlockEditor/BorderRadiusControl',
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
			control: { type: null },
			table: {
				type: { summary: 'function' },
			},
			description: 'Callback to handle onChange.',
		},
	},
};

export default meta;

export const Default = {
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
