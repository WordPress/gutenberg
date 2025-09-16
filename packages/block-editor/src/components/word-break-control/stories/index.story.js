/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WordBreakControl from '../';

const meta = {
	title: 'BlockEditor/WordBreakControl',
	component: WordBreakControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'WordBreakControl component is used to select how text should break when it overflows its container.',
			},
		},
	},
	argTypes: {
		value: {
			control: 'select',
			options: [
				'',
				'normal',
				'break-all',
				'keep-all',
				'break-word',
				'auto-phrase',
			],
			description: 'Currently selected word break value.',
		},
		__next40pxDefaultSize: {
			control: 'boolean',
			description: 'Whether to use the larger 40px default size.',
		},
		__nextHasNoMarginBottom: {
			control: 'boolean',
			description: 'Whether to remove bottom margin.',
		},
		onChange: { action: 'changed' },
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState();
		return (
			<WordBreakControl
				{ ...args }
				value={ value }
				onChange={ ( ...changeArgs ) => {
					onChange( ...changeArgs );
					setValue( ...changeArgs );
				} }
			/>
		);
	},
};

export const WithValue = {
	...Default,
	args: {
		value: 'break-all',
	},
};

export const WithNext40pxSize = {
	...Default,
	args: {
		__next40pxDefaultSize: true,
	},
};

export const WithoutMarginBottom = {
	...Default,
	args: {
		__nextHasNoMarginBottom: true,
	},
};
