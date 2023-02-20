/**
 * External dependencies
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

/**
 * Internal dependencies
 */
import { View } from '../../../view';
import { VStack } from '../..';

const E2E_CONTROLS_PROPS: {
	name: keyof Omit< React.ComponentProps< typeof VStack >, 'children' >;
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
			// responsive: 'responsive',
		},
	},
	// {
	// 	name: 'expanded',
	// 	required: false,
	// 	values: {
	// 		true: true,
	// 		false: false,
	// 	},
	// },
	// {
	// 	name: 'isReversed',
	// 	required: false,
	// 	values: {
	// 		true: true,
	// 		false: false,
	// 	},
	// },
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
	// {
	// 	name: 'wrap',
	// 	required: false,
	// 	values: {
	// 		true: true,
	// 		false: false,
	// 	},
	// },
];

const meta: ComponentMeta< typeof VStack > = {
	component: VStack,
	title: 'Components (Experimental)/VStack',
};
export default meta;

const Template: ComponentStory< typeof VStack > = ( props ) => {
	return (
		<VStack
			{ ...props }
			style={ { background: '#eee', minHeight: '3rem' } }
		>
			{ [ 'One', 'Two', 'Three', 'Four', 'Five' ].map( ( text ) => (
				<View key={ text } style={ { background: '#b9f9ff' } }>
					{ text }
				</View>
			) ) }
		</VStack>
	);
};

export const Default: ComponentStory< typeof VStack > = Template.bind( {} );
Default.args = {
	spacing: 3,
	// The `customE2EControlsProps` is used by custom decorator
	// used for Storybook-powered e2e tests
	// @ts-expect-error
	customE2EControlsProps: E2E_CONTROLS_PROPS,
};
