/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { JustifyContentControl, JustifyToolbar } from '../';

const meta = {
	title: 'BlockEditor/JustifyContentControl',
	component: JustifyContentControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Control component for setting justify content alignment.',
			},
		},
	},
	argTypes: {
		allowedControls: {
			control: { type: null },
			table: {
				type: { summary: 'string[]' },
				defaultValue: {
					summary: "[ 'left', 'center', 'right', 'space-between' ]",
				},
			},
			description: 'An array of strings for what controls to show.',
		},
		isCollapsed: {
			control: { type: null },
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'true' },
			},
			description: 'Whether the control should be collapsed.',
		},
		onChange: {
			action: 'onChange',
			control: { type: null },
			table: {
				type: { summary: 'function' },
			},
			description: 'Function called when the alignment changes.',
		},
		value: {
			control: { type: null },
			table: {
				type: { summary: 'string' },
			},
			description: 'Current value of the alignment setting.',
		},
		popoverProps: {
			control: { type: null },
			table: {
				type: { summary: 'object' },
			},
			description: 'Props to pass to the popover component.',
		},
		isToolbar: {
			control: { type: null },
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
			description: 'Whether to render as a toolbar control.',
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState( 'left' );

		return (
			<JustifyContentControl
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

export const Toolbar = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState( 'left' );

		return (
			<JustifyToolbar
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
