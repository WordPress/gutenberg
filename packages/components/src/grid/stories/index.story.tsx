/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { Grid } from '..';

const meta: Meta< typeof Grid > = {
	component: Grid,
	title: 'Components (Experimental)/Grid',
	argTypes: {
		as: { control: { type: 'text' } },
		align: { control: { type: 'text' } },
		children: { control: { type: null } },
		columnGap: { control: { type: 'text' } },
		columns: {
			table: { type: { summary: 'number' } },
			control: { type: 'number' },
		},
		justify: { control: { type: 'text' } },
		rowGap: { control: { type: 'text' } },
		rows: {
			table: { type: { summary: 'number' } },
			control: { type: 'number' },
		},
		templateColumns: { control: { type: 'text' } },
		templateRows: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Item = ( props: { children: string } ) => (
	<View
		style={ {
			borderRadius: 8,
			background: '#eee',
			padding: 8,
			textAlign: 'center',
		} }
		{ ...props }
	/>
);

const Template: StoryFn< typeof Grid > = ( props ) => (
	<Grid { ...props }>
		<Item>One</Item>
		<Item>Two</Item>
		<Item>Three</Item>
		<Item>Four</Item>
		<Item>Five</Item>
		<Item>Six</Item>
		<Item>Seven</Item>
		<Item>Eight</Item>
	</Grid>
);

export const Default: StoryFn< typeof Grid > = Template.bind( {} );
Default.args = {
	alignment: 'bottom',
	columns: 4,
	gap: 2,
};
