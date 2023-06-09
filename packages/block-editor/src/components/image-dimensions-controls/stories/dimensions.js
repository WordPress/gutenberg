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
import DimensionsItem from '../dimensions';

export default {
	title: 'BlockEditor (Experimental)/ImageDimensionsControls/DimensionsItem',
	component: DimensionsItem,
	argTypes: {
		panelId: { control: { type: null } },
		onChange: { action: 'changed' },
	},
};

export const Default = ( { panelId, onChange: onChangeProp, ...props } ) => {
	const [ dimensions, setDimensions ] = useState( {
		width: undefined,
		height: undefined,
	} );
	const resetAll = () => {
		setDimensions( { width: undefined, height: undefined } );
		onChangeProp( { width: undefined, height: undefined } );
	};
	return (
		<Panel>
			<ToolsPanel panelId={ panelId } resetAll={ resetAll }>
				<DimensionsItem
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
