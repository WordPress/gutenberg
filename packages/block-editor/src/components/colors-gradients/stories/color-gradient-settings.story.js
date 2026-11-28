/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PanelColorGradientSettings from '../panel-color-gradient-settings.js';

const meta = {
	title: 'BlockEditor/PanelColorGradientSettings',
	component: PanelColorGradientSettings,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'A complete panel for color and gradient settings management. Automatically detects available colors and gradients, and provides a ToolsPanel interface with reset functionality. Can render additional children content below the color controls.',
			},
		},
	},
	argTypes: {
		title: {
			control: 'text',
			description: 'Panel title displayed at the top.',
			table: {
				type: { summary: 'string' },
			},
		},
		showTitle: {
			control: 'boolean',
			description: 'Whether to show the panel title.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'true' },
			},
		},
		className: {
			control: 'text',
			description: 'Additional CSS class for the panel.',
			table: {
				type: { summary: 'string' },
			},
		},
		colors: {
			control: 'object',
			description: 'Array of available color palettes.',
			table: {
				type: { summary: 'object[]' },
			},
		},
		gradients: {
			control: 'object',
			description: 'Array of available gradient palettes.',
			table: {
				type: { summary: 'object[]' },
			},
		},
		disableCustomColors: {
			control: 'boolean',
			description: 'Disable custom color selection.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		disableCustomGradients: {
			control: 'boolean',
			description: 'Disable custom gradient selection.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		enableAlpha: {
			control: 'boolean',
			description: 'Enable alpha transparency controls.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		__experimentalIsRenderedInSidebar: {
			control: 'boolean',
			description: 'Whether the panel is rendered in sidebar context.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		settings: {
			control: 'object',
			description: 'Array of color/gradient setting configurations.',
			table: {
				type: { summary: 'object[]' },
			},
		},
		children: {
			control: false,
			description: 'Additional content to render below color controls.',
			table: {
				type: { summary: 'ReactNode' },
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { children, ...args } ) {
		const [ settings, setSettings ] = useState( args.settings );

		const settingsWithHandlers = settings.map( ( setting, index ) => ( {
			...setting,
			onColorChange: ( newColor ) => {
				setSettings( ( prev ) => {
					const updated = [ ...prev ];
					updated[ index ] = {
						...updated[ index ],
						colorValue: newColor,
					};
					return updated;
				} );
			},
			onGradientChange: ( newGradient ) => {
				setSettings( ( prev ) => {
					const updated = [ ...prev ];
					updated[ index ] = {
						...updated[ index ],
						gradientValue: newGradient,
					};
					return updated;
				} );
			},
		} ) );

		return (
			<PanelColorGradientSettings
				{ ...args }
				settings={ settingsWithHandlers }
			>
				{ children }
			</PanelColorGradientSettings>
		);
	},
	args: {
		title: 'Color Settings',
		showTitle: true,
		className: '',
		colors: [
			{
				name: 'Theme Colors',
				slug: 'theme',
				colors: [
					{ name: 'Primary', color: '#007cba', slug: 'primary' },
					{ name: 'Secondary', color: '#006ba1', slug: 'secondary' },
					{ name: 'Tertiary', color: '#0073aa', slug: 'tertiary' },
				],
			},
			{
				name: 'Custom Colors',
				slug: 'custom',
				colors: [
					{ name: 'Red', color: '#ff0000', slug: 'red' },
					{ name: 'Green', color: '#00ff00', slug: 'green' },
					{ name: 'Blue', color: '#0000ff', slug: 'blue' },
					{ name: 'Yellow', color: '#ffff00', slug: 'yellow' },
					{ name: 'Purple', color: '#800080', slug: 'purple' },
					{ name: 'Orange', color: '#ffa500', slug: 'orange' },
				],
			},
		],
		gradients: [
			{
				name: 'Theme Gradients',
				slug: 'theme',
				gradients: [
					{
						name: 'Blue to Purple',
						gradient:
							'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
						slug: 'blue-purple',
					},
					{
						name: 'Sunset',
						gradient:
							'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
						slug: 'sunset',
					},
				],
			},
		],
		disableCustomColors: false,
		disableCustomGradients: false,
		enableAlpha: true,
		__experimentalIsRenderedInSidebar: false,
		settings: [
			{
				label: 'Background Color',
				colorValue: '#007cba',
				gradientValue: undefined,
				clearable: true,
				isShownByDefault: true,
				resetAllFilter: () => ( {
					backgroundColor: undefined,
					customBackgroundColor: undefined,
				} ),
			},
		],
		children: null,
	},
};
