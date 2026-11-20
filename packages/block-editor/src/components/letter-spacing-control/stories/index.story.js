/**
 * Internal dependencies
 */
import LetterSpacingControl from '../';

const meta = {
	title: 'BlockEditor/LetterSpacingControl',
	component: LetterSpacingControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'The `LetterSpacingControl` component renders a UnitControl that lets the user enter a numeric value and select a unit, for example `px` or `rem`.',
			},
		},
	},
	argTypes: {
		onChange: {
			action: 'onChange',
			description: 'A callback function invoked when the value is changed.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		value: {
			control: {
				type: null,
			},
			table: {
				type: {
					summary: 'number',
				},
			},
			description: 'The current value of the letter spacing setting.',
		},
		__next40pxDefaultSize: {
			control: {
				type: 'boolean',
			},
			description:
				'Defines the default size of elements within a block or component.',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
		__unstableInputWidth: {
			description:
				'Input width to pass through to inner UnitControl. Should be a valid CSS value.',
			control: {
				type: null,
			},
			table: {
				type: {
					summary: 'string|number|undefined',
				},
			},
		},
	},
};

export default meta;

/**
 * Default story shows the LetterSpacingControl.
 */
export const Default = {
	args: {
		value: 10,
	},
};
