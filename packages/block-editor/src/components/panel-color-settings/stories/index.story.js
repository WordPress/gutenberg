/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PanelColorSettings from '../';

const meta = {
	title: 'BlockEditor/PanelColorSettings',
	component: PanelColorSettings,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'The `PanelColorSettings` component provides a UI for managing color settings. It wraps the `PanelColorGradientSettings` component while specifically disabling gradient features.',
			},
		},
	},
	argTypes: {
		colorSettings: {
			description: 'Array of color setting objects',
			control: { type: 'object' },
			table: {
				type: {
					summary:
						'Array<{ value: string, onChange: Function, label: string }>',
				},
			},
		},
		className: {
			control: 'text',
			description:
				'Additional class names added to the underlying ToolsPanel instance.',
			table: {
				type: { summary: 'string' },
			},
		},
		colors: {
			control: 'object',
			description:
				'An array of predefined colors to be displayed in the color palette.',
			table: {
				type: { summary: 'Array<{ name: string, color: string }>' },
			},
		},
		disableCustomColors: {
			control: 'boolean',
			description:
				'Whether to disable the option for users to add custom colors.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		children: {
			control: { type: null },
			description:
				'Displayed below the underlying PanelColorGradientSettings instance.',
			table: {
				type: { summary: 'ReactNode' },
			},
		},
		title: {
			control: 'text',
			description: 'The title of the underlying ToolsPanel.',
			table: {
				type: { summary: 'string' },
			},
		},
		showTitle: {
			control: 'boolean',
			description: 'Whether to show the title of the ToolsPanel.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		__experimentalIsRenderedInSidebar: {
			control: 'boolean',
			description: 'Whether this is rendered in the sidebar.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		enableAlpha: {
			control: 'boolean',
			description:
				'Whether to enable the alpha (opacity) slider in the color picker.',
			table: {
				type: { summary: 'boolean' },
			},
		},
	},
};

export default meta;

export const Default = {
	args: {
		colors: [
			{ name: 'Sapphire Blue', color: '#0F52BA' },
			{ name: 'Emerald Green', color: '#50C878' },
			{ name: 'Ruby Red', color: '#E0115F' },
			{ name: 'Amethyst Purple', color: '#9966CC' },
			{ name: 'Topaz Yellow', color: '#FFC87C' },
		],
		title: 'Color',
	},
	render: function Template( args ) {
		const [ backgroundColor, setbackgroundColor ] = useState( '' );
		const [ textColor, setTextColor ] = useState( '' );
		const [ linkColor, setLinkColor ] = useState( '' );

		return (
			<PanelColorSettings
				{ ...args }
				colorSettings={ [
					{
						value: backgroundColor,
						onChange: setbackgroundColor,
						label: 'Background',
					},
					{
						value: textColor,
						onChange: setTextColor,
						label: 'Text',
					},
					{
						value: linkColor,
						onChange: setLinkColor,
						label: 'Link',
					},
				] }
			/>
		);
	},
};
