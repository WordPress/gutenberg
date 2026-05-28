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
	title: 'BlockEditor/DimensionsTool/DimensionsTool',
	component: DimensionsTool,
	tags: [ 'status-private' ],
	argTypes: {
		panelId: { control: false },
		onChange: { action: 'changed' },
	},
};

const EMPTY_OBJECT = {};

export const Default = ( { panelId, onChange, ...props } ) => {
	const [ value, setValue ] = useState( EMPTY_OBJECT );
	const resetAll = () => {
		setValue( EMPTY_OBJECT );
		onChange( EMPTY_OBJECT );
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
						onChange( nextValue );
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
