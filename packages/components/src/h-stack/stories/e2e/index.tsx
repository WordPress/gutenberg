/**
 * External dependencies
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

/**
 * Internal dependencies
 */
import { View } from '../../../view';
import { HStack } from '../..';

const E2E_CONTROLS_PROPS: {
	name: keyof Omit< React.ComponentProps< typeof HStack >, 'children' >;
	required: boolean;
	values: Record< string, any >;
}[] = [
	{
		name: 'alignment',
		required: false,
		values: {
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
		},
	},
	{
		name: 'direction',
		required: false,
		values: {
			row: 'row',
			column: 'column',
		},
	},
	{
		name: 'justify',
		required: false,
		values: {
			spaceAround: 'space-around',
			spaceBetween: 'space-between',
			spaceEvenly: 'space-evenly',
			stretch: 'stretch',
			center: 'center',
			end: 'end',
			flexEnd: 'flex-end',
			flexStart: 'flex-start',
			start: 'start',
		},
	},
];

const meta: ComponentMeta< typeof HStack > = {
	component: HStack,
	title: 'Components (Experimental)/HStack',
};
export default meta;

const Template: ComponentStory< typeof HStack > = ( props ) => {
	return (
		<HStack
			style={ { background: '#eee', minHeight: '3rem' } }
			{ ...props }
		>
			{ [ 'One', 'Two', 'Three', 'Four', 'Five' ].map( ( text ) => (
				<View key={ text } style={ { background: '#b9f9ff' } }>
					{ text }
				</View>
			) ) }
		</HStack>
	);
};

export const Default: ComponentStory< typeof HStack > = Template.bind( {} );
Default.args = {
	spacing: 3,
	// The `customE2EControlsProps` is used by custom decorator
	// used for Storybook-powered e2e tests
	// @ts-expect-error
	customE2EControlsProps: E2E_CONTROLS_PROPS,
};
