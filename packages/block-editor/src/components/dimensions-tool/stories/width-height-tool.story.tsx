import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import {
	Panel,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';
import WidthHeightTool from '../width-height-tool';
import type { WidthHeightToolProps, WidthHeightToolValue } from '../types';

export default {
	id: 'blockeditor-dimensionstool-widthheighttool',
	title: 'Editor/Block Editor/DimensionsTool/WidthHeightTool',
	component: WidthHeightTool,
	tags: [ 'status-private' ],
	argTypes: {
		panelId: { control: false },
		onChange: { action: 'changed' },
	},
} satisfies Meta< typeof WidthHeightTool >;

const EMPTY_OBJECT = {};

export const Default: StoryFn< WidthHeightToolProps > = ( {
	panelId,
	onChange: onChangeProp,
	...props
} ) => {
	const [ value, setValue ] =
		useState< WidthHeightToolValue >( EMPTY_OBJECT );
	const resetAll = () => {
		setValue( EMPTY_OBJECT );
		// Storybook passes the `onChange` action.
		onChangeProp!( EMPTY_OBJECT );
	};
	return (
		<Panel>
			<ToolsPanel
				label="Width & Height"
				panelId={ panelId }
				resetAll={ resetAll }
			>
				<WidthHeightTool
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
Default.args = {
	panelId: 'panel-id',
};

/**
 * With the natural size of the content, the fields suggest fractions of it,
 * e.g. half the size of a high density screenshot.
 */
export const WithSizeSuggestions: StoryFn< WidthHeightToolProps > =
	Default.bind( {} );
WithSizeSuggestions.args = {
	panelId: 'panel-id',
	naturalWidth: 1600,
	naturalHeight: 1000,
};
