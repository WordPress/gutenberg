/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontFamilyControl from '..';

const meta = {
	component: FontFamilyControl,
	title: 'BlockEditor/FontFamilyControl',
	parameters: {
		docs: {
			description: {
				component:
					'FontFamilyControl is a React component that renders a UI for selecting a font family from predefined `typography.fontFamilies` presets.',
			},
			canvas: { sourceState: 'shown' },
		},
	},
	argTypes: {
		onChange: {
			control: false,
			description:
				'A function that receives the new font family value. If called without parameters, it should reset the value.',
			table: {
				type: { summary: 'function' },
				required: true,
			},
		},
		fontFamilies: {
			control: 'object',
			description:
				'A user-provided set of font families to override predefined ones. Each item should have fontFamily (string) and name (string) properties.',
			table: {
				type: {
					summary: 'Array<{ fontFamily: string, name: string }>',
				},
			},
		},
		value: {
			control: 'text',
			description: 'The current font family value.',
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: '""' },
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
		__nextHasNoMarginBottom: {
			control: 'boolean',
			description:
				'Start opting into the new margin-free styles that will become the default in a future version.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( props ) {
		const [ value, setValue ] = useState();
		return (
			<FontFamilyControl
				onChange={ setValue }
				value={ value }
				{ ...props }
			/>
		);
	},
	args: {
		fontFamilies: [
			{
				fontFace: [
					{
						fontFamily: 'Inter',
						fontStretch: 'normal',
						fontStyle: 'normal',
						fontWeight: '200 900',
						src: [
							'file:./assets/fonts/inter/Inter-VariableFont_slnt,wght.ttf',
						],
					},
				],
				fontFamily: '"Inter", sans-serif',
				name: 'Inter',
				slug: 'inter',
			},
			{
				fontFamily:
					'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
				name: 'System Font',
				slug: 'system-font',
			},
		],
		__nextHasNoMarginBottom: true,
		__next40pxDefaultSize: true,
	},
};
