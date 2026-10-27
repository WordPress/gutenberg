import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import {
	Panel,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';
import ScaleTool from '../scale-tool';
import type { ScaleToolProps } from '../types';

export default {
	id: 'blockeditor-dimensionstool-scaletool',
	title: 'Editor/Block Editor/DimensionsTool/ScaleTool',
	component: ScaleTool,
	tags: [ 'status-private' ],
	argTypes: {
		panelId: { control: false },
		onChange: { action: 'changed' },
	},
} satisfies Meta< typeof ScaleTool >;

export const Default: StoryFn< ScaleToolProps > = ( {
	panelId,
	onChange: onChangeProp,
	...props
} ) => {
	const [ value, setValue ] = useState< string | undefined >( undefined );
	const resetAll = () => {
		setValue( undefined );
		onChangeProp( undefined );
	};
	return (
		<Panel>
			<ToolsPanel label="Scale" panelId={ panelId } resetAll={ resetAll }>
				<ScaleTool
					panelId={ panelId }
					onChange={ ( nextValue ) => {
						setValue( nextValue );
						onChangeProp( nextValue );
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
