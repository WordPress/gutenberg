/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import URLInput from '../';

const meta = {
	title: 'BlockEditor/URLInput',
	component: URLInput,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Renders the URL input field used by the `URLInputButton` component. It can be used directly to display the input field in different ways such as in a `Popover` or inline.',
			},
		},
	},
	argTypes: {
		value: {
			control: 'text',
			description: 'The current URL value.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		label: {
			control: 'text',
			description: 'Label for the input.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		className: {
			control: 'text',
			description: 'Optional CSS class for styling.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		placeholder: {
			control: 'text',
			description: 'Placeholder text for the input field.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		disableSuggestions: {
			control: 'boolean',
			description: 'Disable autocomplete suggestions.',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
		onChange: {
			action: 'onChange',
			description: 'Callback when the URL changes.',
			table: {
				type: {
					summary: 'function',
				},
			},
			control: false,
		},
		onkeydown: {
			action: 'onKeyDown',
			description: 'Optional Callback handler for custom keydown logic.',
			table: {
				type: {
					summary: 'function',
				},
			},
			control: false,
		},
	},
};

export default meta;

const Template = ( args ) => {
	const [ value, setValue ] = useState( args.value || '' );

	return (
		<URLInput
			className={ args.className }
			value={ value }
			onChange={ ( newValue ) => setValue( newValue ) }
			{ ...args }
		/>
	);
};

export const Default = {
	render: Template,
	args: {
		label: 'URL',
		value: '',
		placeholder: 'Enter URL...!!!',
		className: 'url-input',
		disableSuggestions: false,
	},
};
