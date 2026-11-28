/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import LinkControl from '../';

const meta = {
	title: 'BlockEditor/LinkControl',
	component: LinkControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Renders a link control. A link control is a controlled input which maintains a value associated with a link (HTML anchor element) and relevant settings for how that link is expected to behave. It is designed to provide a standardized UI for the creation of a link throughout the Editor, see History section at bottom for further background.',
			},
		},
	},
	argTypes: {
		value: {
			control: 'object',
			description: 'The current value of the link (URL and title)',
			table: {
				type: {
					summary: 'object',
				},
			},
		},
		settings: {
			control: 'array',
			description: 'Custom settings for the link control',
			table: {
				type: {
					summary: 'array',
				},
			},
		},
		onChange: {
			action: 'onChange',
			description: 'Callback for when the link value changes',
			table: {
				type: {
					summary: 'function',
				},
			},
			control: false,
		},
		onRemove: {
			action: 'onRemove',
			description: 'Callback for when the link is removed',
			table: {
				type: {
					summary: 'function',
				},
			},
			control: false,
		},
		hasRichPreviews: {
			control: 'boolean',
			description: 'Whether to enable rich link previews.',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
		hasTextControl: {
			control: 'boolean',
			description:
				'Whether to display a text input control for the link title.',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
		inputValue: {
			control: 'text',
			description: 'The current input value for the URL.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		noDirectEntry: {
			control: 'boolean',
			description: 'Whether direct URL entry is disallowed.',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
		noURLSuggestion: {
			control: 'boolean',
			description: 'Whether URL suggestions are disabled.',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
		renderControlBottom: {
			action: 'renderControlBottom',
			description:
				'Optional callback to render content below the link control.',
			table: {
				type: {
					summary: 'function',
				},
			},
			control: false,
		},
		showSuggestions: {
			control: 'boolean',
			description: 'Whether suggestions should be displayed.',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
		suggestionsQuery: {
			control: 'object',
			description: 'Query parameters for fetching link suggestions.',
			table: {
				type: {
					summary: 'object',
				},
			},
		},
	},
};

export default meta;

const Template = ( args ) => {
	const [ linkValue, setLinkValue ] = useState( args.value );

	return (
		<LinkControl
			{ ...args }
			value={ linkValue }
			onChange={ ( value ) => setLinkValue( value ) }
		/>
	);
};

export const Default = {
	render: Template,
	args: {
		value: { url: 'https://wordpress.org', title: 'Link Title' },
		settings: [
			{ id: 'openInNewTab', title: 'Open in new tab' },
			{ id: 'noFollow', title: 'No Follow' },
		],
		forceIsEditingLink: true,
		hasTextControl: true,
	},
};
