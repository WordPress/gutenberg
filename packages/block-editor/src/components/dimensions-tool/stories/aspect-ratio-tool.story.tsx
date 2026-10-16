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

export const Default: StoryFn< AspectRatioToolProps > = ( {
	panelId,
	onChange: onChangeProp,
	...props
} ) => {
	const [ value, setValue ] = useState< string | undefined >( undefined );
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
Default.args = {
	panelId: 'panel-id',
};
