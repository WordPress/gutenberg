/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ColorGradientSettingsDropdown from '../dropdown.js';

const meta = {
	title: 'BlockEditor/ColorGradientSettingsDropdown',
	component: ColorGradientSettingsDropdown,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'A dropdown component for selecting and customizing colors or gradients. Renders as a collection of dropdowns wrapped in ToolsPanelItems.',
			},
		},
	},
	argTypes: {
		colors: {
			control: 'object',
			description: 'Array of available colors.',
			table: {
				type: { summary: 'object[]' },
			},
		},
		gradients: {
			control: 'object',
			description: 'Array of available gradients.',
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
		colorValue: {
			control: 'text',
			description: 'Current selected color value.',
			table: {
				type: { summary: 'string' },
			},
		},
		gradientValue: {
			control: 'text',
			description: 'Current selected gradient value.',
			table: {
				type: { summary: 'string' },
			},
		},
		enableAlpha: {
			control: 'boolean',
			description: 'Enable alpha transparency.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		__experimentalIsRenderedInSidebar: {
			control: 'boolean',
			description:
				'Whether the component is rendered in sidebar context.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		settings: {
			control: 'object',
			description:
				'Array of setting objects that define each dropdown instance.',
			table: {
				type: { summary: 'object[]' },
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { ...args } ) {
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
			<ToolsPanel
				label="Color Settings"
				resetAll={ () => {
					setSettings(
						settings.map( ( setting ) => ( {
							...setting,
							colorValue: undefined,
							gradientValue: undefined,
						} ) )
					);
				} }
			>
				<ColorGradientSettingsDropdown
					colors={ args.colors }
					gradients={ args.gradients }
					disableCustomColors={ args.disableCustomColors }
					disableCustomGradients={ args.disableCustomGradients }
					enableAlpha={ args.enableAlpha }
					__experimentalIsRenderedInSidebar={
						args.__experimentalIsRenderedInSidebar
					}
					settings={ settingsWithHandlers }
					panelId="test-panel"
				/>
			</ToolsPanel>
		);
	},
	args: {
		colors: [
			{
				name: 'Theme',
				slug: 'theme',
				colors: [
					{ name: 'Red', color: '#ff0000', slug: 'red' },
					{ name: 'Green', color: '#00ff00', slug: 'green' },
					{ name: 'Blue', color: '#0000ff', slug: 'blue' },
				],
			},
		],
		gradients: [
			{
				name: 'Theme',
				slug: 'theme',
				gradients: [
					{
						name: 'Sunset',
						gradient: 'linear-gradient(to right, #ff7e5f, #feb47b)',
						slug: 'gradient-1',
					},
					{
						name: 'Ocean',
						gradient: 'linear-gradient(to right, #00c6ff, #0072ff)',
						slug: 'gradient-2',
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
				colorValue: '#00ff00',
				gradientValue: undefined,
				clearable: true,
				isShownByDefault: true,
				resetAllFilter: () => ( {
					backgroundColor: undefined,
					customBackgroundColor: undefined,
					gradient: undefined,
					customGradient: undefined,
				} ),
			},
		],
	},
};
