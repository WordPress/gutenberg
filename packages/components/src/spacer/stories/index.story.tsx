/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-webpack5';

/**
 * Internal dependencies
 */
import { Spacer } from '..';

const controls = [
	'margin',
	'marginY',
	'marginX',
	'marginTop',
	'marginBottom',
	'marginLeft',
	'marginRight',

	'padding',
	'paddingY',
	'paddingX',
	'paddingTop',
	'paddingBottom',
	'paddingLeft',
	'paddingRight',
].reduce(
	( acc, prop ) => ( { ...acc, [ prop ]: { control: { type: 'text' } } } ),
	{}
);

const meta: Meta< typeof Spacer > = {
	component: Spacer,
	title: 'Components/Spacer',
	argTypes: {
		as: { control: { type: 'text' } },
		children: {
			control: { type: 'text' },
		},
		...controls,
	},
	tags: [ 'status-experimental' ],
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const BlackBox = () => (
	<div
		style={ { backgroundColor: 'black', width: '100px', height: '100px' } }
	/>
);

const Template: StoryFn< typeof Spacer > = ( { onChange, ...args } ) => {
	return (
		<>
			<BlackBox />
			<Spacer { ...args } />
			<BlackBox />
		</>
	);
};

export const Default: StoryFn< typeof Spacer > = Template.bind( {} );
Default.args = {
	children: 'This is the spacer',
};
