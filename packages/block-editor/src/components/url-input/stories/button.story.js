/**
 * Internal dependencies
 */
import URLInputButton from '../button';

const meta = {
	title: 'BlockEditor/URLInputButton',
	component: URLInputButton,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Render a URL input button that pops up an input to search for and select a post or enter any arbitrary URL.',
			},
		},
	},
	argTypes: {
		url: {
			control: 'text',
			description:
				'This should be set to the attribute (or component state) property used to store the URL.',
			type: {
				required: true,
				name: 'string',
			},
		},
		onChange: {
			control: {
				type: null,
			},
			description: `Called when the value changes. The second parameter is null unless the user selects a post from the suggestions dropdown.`,
			type: {
				required: true,
				name: 'function',
			},
			action: 'onChange',
		},
	},
};

export default meta;

export const Default = {};
