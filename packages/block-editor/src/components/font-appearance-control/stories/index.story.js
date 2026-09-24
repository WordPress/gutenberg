/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontAppearanceControl from '../';

const meta = {
	title: 'BlockEditor/FontAppearanceControl',
	component: FontAppearanceControl,
	parameters: {
		docs: {
			canvas: {
				sourceState: 'shown',
			},
			description: {
				component: `
\`FontAppearanceControl\` is a component designed to display and select font style and weight options for a given font family.

Note: The margin below the select control is not included within the component itself. It has been added here to enhance visibility of the options in the storybook.`,
			},
			story: {
				height: '150px',
			},
		},
	},
	argTypes: {
		__next40pxDefaultSize: {
			control: 'boolean',
			description: 'Opt into the larger default height.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
		hasFontStyles: {
			control: 'boolean',
			description: 'Enable or disable font styles.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'true' },
			},
		},
		hasFontWeights: {
			control: 'boolean',
			description: 'Enable or disable font weights.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'true' },
			},
		},
		fontFamilyFaces: {
			control: 'object',
			description: 'Font faces including style and weight definitions.',
			table: {
				type: { summary: 'Array' },
				defaultValue: { summary: 'undefined' },
			},
		},
		value: {
			control: 'object',
			description: 'The currently selected font style and weight.',
			table: {
				type: { summary: 'object' },
				defaultValue: { summary: '{}' },
			},
		},
		onChange: {
			action: 'changed',
			description: 'Callback function triggered when the value changes.',
			table: {
				type: { summary: 'function' },
			},
		},
	},
};

export default meta;

const Template = ( args ) => {
	const [ value, setValue ] = useState( {
		fontStyle: undefined,
		fontWeight: undefined,
	} );

	return (
		<FontAppearanceControl
			{ ...args }
			value={ value }
			onChange={ ( newStyle ) => {
				setValue( newStyle );
				args.onChange( newStyle );
			} }
		/>
	);
};

export const Default = {
	render: Template,
	args: {
		hasFontStyles: true,
		hasFontWeights: true,
		fontFamilyFaces: [
			{
				fontFamily: 'roboto',
				fontStyle: 'italic',
				fontWeight: '400',
			},
			{
				fontFamily: 'roboto',
				fontStyle: 'normal',
				fontWeight: '700',
			},
		],
	},
};
