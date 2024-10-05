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
import AspectRatioTool from '../aspect-ratio-tool';

export default {
	title: 'BlockEditor (Private APIs)/DimensionsTool/AspectRatioTool',
	component: AspectRatioTool,
	argTypes: {
		panelId: { control: { type: undefined } },
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
			<ToolsPanel
				label="Aspect Ratio"
				panelId={ panelId }
				resetAll={ resetAll }
			>
				<AspectRatioTool
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
