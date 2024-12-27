/**
 * WordPress dependencies
 */
import { useReducer } from '@wordpress/element';
import {
	Panel,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ResolutionTool from '..';

export default {
	title: 'BlockEditor/ResolutionControl',
	component: ResolutionTool,
	tags: [ 'status-private' ],
	argTypes: {
		panelId: { control: false },
		onChange: { action: 'changed' },
	},
};

export const Default = ( {
	label,
	panelId,
	onChange: onChangeProp,
	...props
} ) => {
	const [ attributes, setAttributes ] = useReducer(
		( prevState, nextState ) => ( { ...prevState, ...nextState } ),
		{}
	);
	const { resolution } = attributes;
	const resetAll = ( resetFilters = [] ) => {
		let newAttributes = {};

		resetFilters.forEach( ( resetFilter ) => {
			newAttributes = {
				...newAttributes,
				...resetFilter( newAttributes ),
			};
		} );

		setAttributes( newAttributes );
		onChangeProp( undefined );
	};
	return (
		<Panel>
			<ToolsPanel
				label={ label }
				panelId={ panelId }
				resetAll={ resetAll }
			>
				<ResolutionTool
					panelId={ panelId }
					onChange={ ( newValue ) => {
						setAttributes( { resolution: newValue } );
						onChangeProp( newValue );
					} }
					value={ resolution }
					resetAllFilter={ () => ( {
						resolution: undefined,
					} ) }
					{ ...props }
				/>
			</ToolsPanel>
		</Panel>
	);
};
Default.args = {
	label: 'Settings',
	defaultValue: 'full',
	panelId: 'panel-id',
};
