/**
 * External dependencies
 */
import type { StoryFn, Meta } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import { View } from '../../view';
import { HStack } from '..';

const ALIGNMENTS = {
	top: 'top',
	topLeft: 'topLeft',
	topRight: 'topRight',
	left: 'left',
	center: 'center',
	right: 'right',
	bottom: 'bottom',
	bottomLeft: 'bottomLeft',
	bottomRight: 'bottomRight',
	edge: 'edge',
	stretch: 'stretch',
};

const DIRECTIONS = {
	row: 'row',
	column: 'column',
	responsive: [ 'column', 'row' ],
};

const JUSTIFICATIONS = {
	'space-around': 'space-around',
	'space-between': 'space-between',
	'space-evenly': 'space-evenly',
	stretch: 'stretch',
	center: 'center',
	end: 'end',
	'flex-end': 'flex-end',
	'flex-start': 'flex-start',
	start: 'start',
};

const meta: Meta< typeof HStack > = {
	component: HStack,
	title: 'Components/Layout/HStack',
	id: 'components-hstack',
	argTypes: {
		as: {
			control: false,
		},
		children: {
			control: false,
		},
		alignment: {
			control: { type: 'select' },
			options: Object.keys( ALIGNMENTS ),
			mapping: ALIGNMENTS,
		},
		direction: {
			control: { type: 'select' },
			options: Object.keys( DIRECTIONS ),
			mapping: DIRECTIONS,
		},
		justify: {
			control: { type: 'select' },
			options: Object.keys( JUSTIFICATIONS ),
			mapping: JUSTIFICATIONS,
		},
		spacing: {
			control: { type: 'text' },
		},
	},
	tags: [ 'status-experimental' ],
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof HStack > = ( args ) => (
	<HStack { ...args } style={ { background: '#eee', minHeight: '3rem' } }>
		{ [ 'One', 'Two', 'Three', 'Four', 'Five' ].map( ( text ) => (
			<View key={ text } style={ { background: '#b9f9ff' } }>
				{ text }
			</View>
		) ) }
	</HStack>
);

export const Default: StoryFn< typeof HStack > = Template.bind( {} );
Default.args = {
	spacing: '3',
};
