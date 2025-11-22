/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import LineHeightControl from '../';

export default {
	component: LineHeightControl,
	title: 'BlockEditor/LineHeightControl',
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'LineHeightControl renders a NumberControl with custom spin controls that lets the user enter a line height value.',
			},
		},
	},
	argTypes: {
		value: {
			control: { type: null },
			description: 'The current value of the line height setting.',
			table: {
				type: { summary: 'string' },
			},
		},
		onChange: {
			action: 'onChange',
			control: { type: null },
			description:
				'A callback function invoked when the value is changed.',
			table: {
				type: { summary: 'function' },
			},
		},
		__unstableInputWidth: {
			control: 'text',
			description:
				'Input width to pass through to inner NumberControl. Should be a valid CSS value.',
			table: {
				type: { summary: 'string | number | undefined' },
				defaultValue: { summary: '60px' },
			},
		},
		__next40pxDefaultSize: {
			control: 'boolean',
			description:
				'Start opting into the larger default height that will become the default size in a future version.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
	},
};

const Template = ( props ) => {
	const [ value, setValue ] = useState();
	return (
		<LineHeightControl onChange={ setValue } value={ value } { ...props } />
	);
};

export const Default = Template.bind( {} );
Default.args = {
	__next40pxDefaultSize: true,
	__unstableInputWidth: '100px',
};

export const UnconstrainedWidth = Template.bind( {} );
UnconstrainedWidth.args = {
	...Default.args,
	__unstableInputWidth: '100%',
};
