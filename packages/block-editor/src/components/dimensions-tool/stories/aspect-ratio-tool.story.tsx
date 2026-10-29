import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import {
	Panel,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';
import AspectRatioTool from '../aspect-ratio-tool';
import type { AspectRatioToolProps } from '../types';

export default {
	id: 'blockeditor-dimensionstool-aspectratiotool',
	title: 'Editor/Block Editor/DimensionsTool/AspectRatioTool',
	component: AspectRatioTool,
	tags: [ 'status-private' ],
	argTypes: {
		panelId: { control: false },
		onChange: { action: 'changed' },
	},
} satisfies Meta< typeof AspectRatioTool >;

const Template: StoryFn< AspectRatioToolProps > = ( {
	panelId,
	onChange: onChangeProp,
	value: initialValue,
	...props
} ) => {
	const [ value, setValue ] = useState< string | null | undefined >(
		initialValue
	);
	const resetAll = () => {
		setValue( undefined );
		// Storybook passes the `onChange` action.
		onChangeProp!( undefined );
	};
	return (
		<Panel>
			<ToolsPanel
				label="Aspect Ratio"
				panelId={ panelId }
				resetAll={ resetAll }
			>
				<AspectRatioTool
					panelId={ panelId }
					onChange={ ( nextValue ) => {
						setValue( nextValue );
						// Storybook passes the `onChange` action.
						onChangeProp!( nextValue );
					} }
					value={ value }
					{ ...props }
				/>
			</ToolsPanel>
		</Panel>
	);
};

export const Default: StoryFn< AspectRatioToolProps > = Template.bind( {} );
Default.args = {
	panelId: 'panel-id',
};

/**
 * The options can be provided, as the editor does with the default and theme
 * ratios. Each option shows an icon in the shape of its ratio.
 */
export const WithOptions: StoryFn< AspectRatioToolProps > = Template.bind( {} );
WithOptions.args = {
	panelId: 'panel-id',
	value: '16/9',
	options: [
		{ label: 'Original', value: 'auto' },
		{ label: 'Square - 1:1', value: '1' },
		{ label: 'Standard - 4:3', value: '4/3' },
		{ label: 'Portrait - 3:4', value: '3/4' },
		{ label: 'Classic - 3:2', value: '3/2' },
		{ label: 'Classic Portrait - 2:3', value: '2/3' },
		{ label: 'Wide - 16:9', value: '16/9' },
		{ label: 'Tall - 9:16', value: '9/16' },
		// Selected for a ratio that doesn't match any other option.
		{ label: 'Custom', value: 'custom', disabled: true, hidden: true },
	],
};

/**
 * A ratio that doesn't match any option is shown as "Custom", with an icon in
 * the shape of the actual ratio.
 */
export const CustomRatio: StoryFn< AspectRatioToolProps > = Template.bind( {} );
CustomRatio.args = {
	...WithOptions.args,
	value: '21/9',
};

/**
 * A long name, such as one from a theme, is truncated with an ellipsis in the
 * closed control.
 */
export const LongLabel: StoryFn< AspectRatioToolProps > = Template.bind( {} );
LongLabel.args = {
	...WithOptions.args,
	value: '4/3',
	options: [
		{ label: 'Original', value: 'auto' },
		{
			label: 'A theme preset with a very long name that does not fit - 4:3',
			value: '4/3',
		},
		{ label: 'Wide - 16:9', value: '16/9' },
	],
};
LongLabel.decorators = [
	( Story ) => (
		<div style={ { width: 260 } }>
			<Story />
		</div>
	),
];
