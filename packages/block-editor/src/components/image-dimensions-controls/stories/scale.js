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
import ScaleItem from '../scale';

export default {
	title: 'BlockEditor (Experimental)/ImageDimensionsControls/ScaleItem',
	component: ScaleItem,
	argTypes: {
		panelId: { control: { type: null } },
		onChange: { action: 'changed' },
	},
};

export const Default = ( { panelId, onChange: onChangeProp, ...props } ) => {
	const [ scale, setScale ] = useState( undefined );
	const resetAll = () => {
		setScale( undefined );
		onChangeProp( undefined );
	};
	return (
		<Panel>
			<ToolsPanel panelId={ panelId } resetAll={ resetAll }>
				<ScaleItem
					panelId={ panelId }
					onChange={ ( newValue ) => {
						setScale( newValue );
						onChangeProp( newValue );
					} }
					value={ scale }
					{ ...props }
				/>
			</ToolsPanel>
		</Panel>
	);
};
Default.args = {
	panelId: 'panel-id',
};
