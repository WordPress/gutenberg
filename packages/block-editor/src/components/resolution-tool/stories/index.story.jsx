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
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'A control for selecting image resolution with preset size options.',
			},
		},
	},
	argTypes: {
		value: {
			control: { type: null },
			description: 'Currently selected resolution value.',
			table: { type: { summary: 'string' } },
		},
		onChange: {
			action: 'onChange',
			control: { type: null },
			description: 'Handles change in resolution selection.',
			table: {
				type: { summary: 'function' },
			},
		},
		options: {
			control: 'object',
			description: 'Array of resolution options to display.',
			table: {
				type: { summary: 'array' },
			},
		},
		defaultValue: {
			control: 'radio',
			options: [ 'thumbnail', 'medium', 'large', 'full' ],
			description: 'Default resolution value.',
			table: {
				type: { summary: 'string' },
			},
		},
		isShownByDefault: {
			control: 'boolean',
			description:
				'Whether the control is shown by default in the panel.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		panelId: {
			control: { type: null },
			description: 'ID of the parent tools panel.',
			table: {
				type: { summary: 'string' },
			},
		},
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
