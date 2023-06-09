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
import ImageDimensionsControls from '..';

export default {
	title: 'BlockEditor (Experimental)/ImageDimensionsControls',
	component: ImageDimensionsControls,
	argTypes: {
		panelId: { control: { type: null } },
		onChange: { action: 'changed' },
	},
};

export const Default = ( { panelId, onChange: onChangeProp, ...props } ) => {
	const [ dimensions, setDimensions ] = useState( {} );
	const resetAll = () => {
		setDimensions( undefined );
		onChangeProp( undefined );
	};
	return (
		<Panel>
			<ToolsPanel panelId={ panelId } resetAll={ resetAll }>
				<ImageDimensionsControls
					panelId={ panelId }
					onChange={ ( newValue ) => {
						setDimensions( newValue );
						onChangeProp( newValue );
					} }
					value={ dimensions }
					{ ...props }
				/>
			</ToolsPanel>
		</Panel>
	);
};
Default.args = {
	panelId: 'panel-id',
};
