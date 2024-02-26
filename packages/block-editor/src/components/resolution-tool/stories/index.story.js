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
import ResolutionTool from '..';

export default {
	title: 'BlockEditor (Private APIs)/ResolutionControl',
	component: ResolutionTool,
	argTypes: {
		panelId: { control: { type: null } },
		onChange: { action: 'changed' },
	},
};

export const Default = ( { panelId, onChange: onChangeProp, ...props } ) => {
	const [ resolution, setResolution ] = useState( undefined );
	const resetAll = () => {
		setResolution( undefined );
		onChangeProp( undefined );
	};
	return (
		<Panel>
			<ToolsPanel panelId={ panelId } resetAll={ resetAll }>
				<ResolutionTool
					panelId={ panelId }
					onChange={ ( newValue ) => {
						setResolution( newValue );
						onChangeProp( newValue );
					} }
					value={ resolution }
					{ ...props }
				/>
			</ToolsPanel>
		</Panel>
	);
};
Default.args = {
	panelId: 'panel-id',
};
