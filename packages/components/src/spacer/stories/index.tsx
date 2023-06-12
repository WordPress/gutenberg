/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

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

const meta: ComponentMeta< typeof Spacer > = {
	component: Spacer,
	title: 'Components (Experimental)/Spacer',
	argTypes: {
		as: { control: { type: 'text' } },
		children: {
			control: { type: 'text' },
		},
		...controls,
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const BlackBox = () => (
	<div
		style={ { backgroundColor: 'black', width: '100px', height: '100px' } }
	/>
);

const Template: ComponentStory< typeof Spacer > = ( { onChange, ...args } ) => {
	return (
		<>
			<BlackBox />
			<Spacer { ...args } />
			<BlackBox />
		</>
	);
};

export const Default: ComponentStory< typeof Spacer > = Template.bind( {} );
Default.args = {
	children: 'This is the spacer',
};
