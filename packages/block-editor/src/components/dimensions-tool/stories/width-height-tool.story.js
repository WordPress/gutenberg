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
import WidthHeightTool from '../width-height-tool';

export default {
	title: 'BlockEditor (Private APIs)/DimensionsTool/WidthHeightTool',
	component: WidthHeightTool,
	argTypes: {
		panelId: { control: { type: null } },
		onChange: { action: 'changed' },
	},
};

const EMPTY_OBJECT = {};

export const Default = ( { panelId, onChange: onChangeProp, ...props } ) => {
	const [ value, setValue ] = useState( EMPTY_OBJECT );
	const resetAll = () => {
		setValue( EMPTY_OBJECT );
		onChangeProp( EMPTY_OBJECT );
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
