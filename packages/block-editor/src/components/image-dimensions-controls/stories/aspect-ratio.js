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
import AspectRatioItem from '../aspect-ratio';

export default {
	title: 'BlockEditor (Experimental)/ImageDimensionsControls/AspectRatioItem',
	component: AspectRatioItem,
	argTypes: {
		panelId: { control: { type: null } },
		onChange: { action: 'changed' },
	},
};

export const Default = ( { panelId, onChange: onChangeProp, ...props } ) => {
	const [ aspectRatio, setAspectRatio ] = useState( 'auto' );
	const resetAll = () => {
		setAspectRatio( undefined );
		onChangeProp( undefined );
	};
	return (
		<Panel>
			<ToolsPanel panelId={ panelId } resetAll={ resetAll }>
				<AspectRatioItem
					panelId={ panelId }
					onChange={ ( newValue ) => {
						setAspectRatio( newValue );
						onChangeProp( newValue );
					} }
					value={ aspectRatio }
					{ ...props }
				/>
			</ToolsPanel>
		</Panel>
	);
};
Default.args = {
	panelId: 'panel-id',
};
