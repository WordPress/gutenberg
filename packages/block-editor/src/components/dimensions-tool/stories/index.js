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
import DimensionsTool from '..';

export default {
	title: 'BlockEditor (Private APIs)/DimensionsControls',
	component: DimensionsTool,
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
				label="Dimensions"
				panelId={ panelId }
				resetAll={ resetAll }
			>
				<DimensionsTool
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
