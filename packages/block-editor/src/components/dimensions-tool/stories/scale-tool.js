/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	Panel,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ScaleTool from '../scale-tool';

export default {
	title: 'BlockEditor (Private APIs)/DimensionsTool/ScaleTool',
	component: ScaleTool,
	argTypes: {
		panelId: { control: { type: null } },
		onChange: { action: 'changed' },
	},
};

export const Default = ( { panelId, onChange: onChangeProp, ...props } ) => {
	const [ value, setValue ] = useState( undefined );
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
