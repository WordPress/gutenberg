import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import {
	Panel,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';
import DimensionsTool from '..';
import type { Dimensions, DimensionsToolProps } from '../types';

export default {
	id: 'blockeditor-dimensionstool-dimensionstool',
	title: 'Editor/Block Editor/DimensionsTool/DimensionsTool',
	component: DimensionsTool,
	tags: [ 'status-private' ],
	argTypes: {
		panelId: { control: false },
		onChange: { action: 'changed' },
	},
} satisfies Meta< typeof DimensionsTool >;

const EMPTY_OBJECT = {};

export const Default: StoryFn< DimensionsToolProps > = ( {
	panelId,
	onChange,
	...props
} ) => {
	const [ value, setValue ] = useState< Dimensions >( EMPTY_OBJECT );
	const resetAll = () => {
		setValue( EMPTY_OBJECT );
		// Storybook passes the `onChange` action.
		onChange!( EMPTY_OBJECT );
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
						// Storybook passes the `onChange` action.
						onChange!( nextValue );
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
