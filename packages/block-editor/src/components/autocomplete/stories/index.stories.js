import { useState } from '@wordpress/element';
import { Autocomplete } from '../';

/**
 * @type {import('@storybook/react').Meta}
 */
const meta = {
	title: 'Block Editor Components/Autocomplete',
	component: Autocomplete,
	// Best Practice: Add parameters for component description and default source view.
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'The Autocomplete component is used to display a list of suggestions in response to user input, typically triggered by a specific prefix (like "@" or "/").',
			},
		},
	},
	// Best Practice: Define argTypes for props.
	// In this case, since we use a custom render function for state, we'll keep it simple.
	argTypes: {
		completers: {
			control: { type: null },
		},
	},
};
export default meta;

// A simple completer for demonstration. It triggers on "/" and suggests block names.
const blockCompleter = [
	{
		name: 'blocks',
		triggerPrefix: '/',
		options: [ 'Paragraph', 'Image', 'Heading', 'Button' ],
		getOptionKeywords: ( option ) => [ option ],
		getOptionLabel: ( option ) => <span>{ option }</span>,
		getOptionCompletion: ( option ) => option,
	},
];

// Best Practice: Write stories as objects (CSF 3 format).
// Use a render function for components that need their own state.
export const Default = {
	render: function Template() {
		return (
			<>
				<p>
					This is a content-editable area. Type `/` to trigger the
					autocomplete suggestions.
				</p>
				<Autocomplete completers={ blockCompleter }>
					{ ( {
						isExpanded,
						listBoxId,
						activeId,
						onKeyDown,
						onFocus,
					} ) => (
						<div
							contentEditable
							onKeyDown={ onKeyDown }
							onFocus={ onFocus }
							aria-autocomplete="list"
							aria-expanded={ isExpanded }
							aria-owns={ listBoxId }
							aria-activedescendant={ activeId }
							style={ {
								border: '1px solid #ccc',
								padding: '8px',
								minHeight: '100px',
								outline: '1px solid transparent',
							} }
						></div>
					) }
				</Autocomplete>
			</>
		);
	},
};
