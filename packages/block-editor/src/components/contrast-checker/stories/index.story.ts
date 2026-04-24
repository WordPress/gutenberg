/**
 * Internal dependencies
 */
import ContrastChecker from '../';

const meta = {
	title: 'BlockEditor/ContrastChecker',
	component: ContrastChecker,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Determines if contrast for text styles is sufficient (WCAG 2.0 AA) when used with a given background color.',
			},
		},
	},
	argTypes: {
		backgroundColor: {
			control: 'color',
			description:
				'The background color to check the contrast of text against.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		fallbackBackgroundColor: {
			control: 'color',
			description:
				'A fallback background color value, in case `backgroundColor` is not available.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		textColor: {
			control: 'color',
			description:
				'The text color to check the contrast of the background against.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		fallbackTextColor: {
			control: 'color',
			description:
				'A fallback text color value, in case `textColor` is not available.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		fontSize: {
			control: 'number',
			description:
				'The font-size (as a `px` value) of the text to check the contrast against.',
			table: {
				type: {
					summary: 'number',
				},
			},
		},
		isLargeText: {
			control: 'boolean',
			description:
				'Whether the text is large (approximately `24px` or higher).',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
		linkColor: {
			control: 'color',
			description: 'The link color to check the contrast against.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		fallbackLinkColor: {
			control: 'color',
			description: 'Fallback link color if linkColor is not available.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		enableAlphaChecker: {
			control: 'boolean',
			description: 'Whether to enable checking for transparent colors.',
			table: {
				type: {
					summary: 'boolean',
				},
				defaultValue: { summary: false },
			},
		},
	},
};

export default meta;

export const Default = {
	args: {
		backgroundColor: '#ffffff',
		textColor: '#ffffff',
	},
};
