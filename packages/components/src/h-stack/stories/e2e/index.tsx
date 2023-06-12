/**
 * External dependencies
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

/**
 * Internal dependencies
 */
import { View } from '../../../view';
import { HStack } from '../..';

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
};
